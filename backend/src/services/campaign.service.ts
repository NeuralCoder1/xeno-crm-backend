import { CampaignStatus, Channel, CommunicationStatus, SegmentStatus, type Campaign, type Customer, type Prisma } from "@prisma/client";
import { CampaignRepository } from "../repositories/campaign.repository";
import { CustomerRepository } from "../repositories/customer.repository";
import { SegmentRepository } from "../repositories/segment.repository";
import type { CampaignAnalytics, CampaignListQuery, CreateCampaignInput, UpdateCampaignInput } from "../types/campaign";
import type { AudienceRuleGroup } from "../types/segment";
import { AppError } from "../utils/appError";
import { AudienceRuleService } from "./audienceRule.service";
import { ChannelServiceClient } from "./channelServiceClient.service";

const emptyMetrics = {
  queued: 0,
  sent: 0,
  delivered: 0,
  opened: 0,
  clicked: 0,
  bounced: 0,
  failed: 0,
  unsubscribed: 0,
  converted: 0
};

function canMutateCampaign(status: CampaignStatus): boolean {
  return status === CampaignStatus.draft || status === CampaignStatus.scheduled;
}

export class CampaignService {
  constructor(
    private readonly campaignRepository = new CampaignRepository(),
    private readonly segmentRepository = new SegmentRepository(),
    private readonly customerRepository = new CustomerRepository(),
    private readonly audienceRuleService = new AudienceRuleService(),
    private readonly channelServiceClient = new ChannelServiceClient()
  ) {}

  async createCampaign(input: CreateCampaignInput): Promise<Campaign> {
    await this.ensureSegmentExists(input.segmentId);

    return this.campaignRepository.create({
      name: input.name,
      description: input.description,
      type: input.type,
      channel: input.channel,
      status: input.scheduledAt ? CampaignStatus.scheduled : CampaignStatus.draft,
      segment: {
        connect: {
          id: input.segmentId
        }
      },
      templateId: input.templateId,
      content: input.content,
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
      metrics: emptyMetrics
    });
  }

  getCampaigns(query: CampaignListQuery = {}): Promise<Campaign[]> {
    return this.campaignRepository.findAll(query);
  }

  async getCampaignById(id: string): Promise<Campaign> {
    const campaign = await this.campaignRepository.findById(id);

    if (!campaign) {
      throw new AppError("Campaign not found.", 404, "CAMPAIGN_NOT_FOUND");
    }

    return campaign;
  }

  async updateCampaign(id: string, input: UpdateCampaignInput): Promise<Campaign> {
    const campaign = await this.getCampaignById(id);

    if (!canMutateCampaign(campaign.status)) {
      throw new AppError("Only draft or scheduled campaigns can be updated.", 400, "INVALID_CAMPAIGN_STATE");
    }

    if (input.segmentId) {
      await this.ensureSegmentExists(input.segmentId);
    }

    const data: Prisma.CampaignUpdateInput = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.description !== undefined) data.description = input.description;
    if (input.type !== undefined) data.type = input.type;
    if (input.channel !== undefined) data.channel = input.channel;
    if (input.segmentId !== undefined) data.segment = { connect: { id: input.segmentId } };
    if (input.templateId !== undefined) data.templateId = input.templateId;
    if (input.content !== undefined) data.content = input.content;
    if (input.scheduledAt !== undefined) data.scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : null;
    if (input.status !== undefined) data.status = input.status;

    return this.campaignRepository.update(id, data);
  }

  async launchCampaign(id: string): Promise<{ campaignId: string; status: CampaignStatus; audienceSize: number; queuedCommunications: number }> {
    const campaign = await this.getCampaignById(id);

    if (!canMutateCampaign(campaign.status)) {
      throw new AppError("Campaign cannot be launched from its current status.", 400, "INVALID_CAMPAIGN_STATE");
    }

    const segment = await this.ensureSegmentExists(campaign.segmentId);

    if (segment.status !== SegmentStatus.active) {
      throw new AppError("Campaign segment must be active before launch.", 400, "INVALID_SEGMENT_STATE");
    }

    const audienceWhere = this.audienceRuleService.buildCustomerWhere(segment.rules as unknown as AudienceRuleGroup);
    const audience = (await this.customerRepository.findByWhere(audienceWhere)).filter((customer) =>
      this.hasChannelConsent(customer, campaign.channel)
    );
    const now = new Date();
    const logs = audience.map((customer) => {
      return {
        campaignId: campaign.id,
        customerId: customer.id,
        channel: campaign.channel,
        recipient: this.resolveRecipient(customer, campaign.channel),
        status: CommunicationStatus.queued,
        idempotencyKey: `${campaign.id}:${customer.id}:${campaign.channel}`,
        events: []
      };
    });

    await this.campaignRepository.createCommunicationLogs(logs);
    const communicationLogs = await this.campaignRepository.findCommunicationLogsByCampaignId(campaign.id);
    await this.campaignRepository.update(campaign.id, {
      status: CampaignStatus.running,
      segmentVersion: segment.version,
      audienceSnapshot: {
        segmentId: segment.id,
        segmentVersion: segment.version,
        audienceSize: audience.length,
        evaluatedAt: now.toISOString()
      },
      launchedAt: now,
      metrics: {
        ...emptyMetrics,
        queued: audience.length
      }
    });

    await Promise.all(
      communicationLogs.map((communicationLog) =>
        this.channelServiceClient.send({
          communicationId: communicationLog.id,
          campaignId: communicationLog.campaignId,
          customerId: communicationLog.customerId,
          recipient: communicationLog.recipient,
          channel: communicationLog.channel,
          content: campaign.content
        })
      )
    );

    return {
      campaignId: campaign.id,
      status: CampaignStatus.running,
      audienceSize: audience.length,
      queuedCommunications: audience.length
    };
  }

  async getCampaignAnalytics(id: string): Promise<CampaignAnalytics> {
    await this.getCampaignById(id);
    const grouped = await this.campaignRepository.countCommunicationLogs(id);
    const analytics: CampaignAnalytics = {
      campaignId: id,
      metrics: {
        queued: 0,
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        bounced: 0,
        failed: 0,
        unsubscribed: 0,
        converted: 0
      },
      rates: {
        deliveryRate: 0,
        openRate: 0,
        clickRate: 0,
        conversionRate: 0
      }
    };

    for (const group of grouped) {
      analytics.metrics[group.status] += group.count;
    }

    analytics.rates = {
      deliveryRate: this.rate(analytics.metrics.delivered, analytics.metrics.sent),
      openRate: this.rate(analytics.metrics.opened, analytics.metrics.delivered),
      clickRate: this.rate(analytics.metrics.clicked, analytics.metrics.delivered),
      conversionRate: this.rate(analytics.metrics.converted, analytics.metrics.delivered)
    };

    return analytics;
  }

  private rate(numerator: number, denominator: number): number {
    if (denominator === 0) {
      return 0;
    }

    return Number((numerator / denominator).toFixed(4));
  }

  private async ensureSegmentExists(segmentId: string) {
    const segment = await this.segmentRepository.findById(segmentId);

    if (!segment) {
      throw new AppError("Segment not found.", 404, "SEGMENT_NOT_FOUND");
    }

    return segment;
  }

  private hasChannelConsent(customer: Customer, channel: Channel): boolean {
    switch (channel) {
      case Channel.email:
        return Boolean(customer.email && customer.consentEmail);
      case Channel.sms:
        return Boolean(customer.phone && customer.consentSms);
      case Channel.whatsapp:
        return Boolean(customer.phone && customer.consentWhatsapp);
      case Channel.rcs:
        return Boolean(customer.phone && customer.consentRcs);
      case Channel.push:
        return Boolean(customer.consentPush);
      default:
        return false;
    }
  }

  private resolveRecipient(customer: Customer, channel: Channel): string {
    if (channel === Channel.email && customer.email) return customer.email;
    if ((channel === Channel.sms || channel === Channel.whatsapp || channel === Channel.rcs) && customer.phone) return customer.phone;
    return customer.id;
  }

}
