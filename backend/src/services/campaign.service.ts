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
      const rand = Math.random();
      let status: CommunicationStatus;
      let events: any[] = [];

      if (rand < 0.70) {
        status = CommunicationStatus.delivered;
        events = [
          { eventId: `${campaign.id}:${customer.id}:sent`, type: "sent", occurredAt: now.toISOString(), receivedAt: now.toISOString() },
          { eventId: `${campaign.id}:${customer.id}:delivered`, type: "delivered", occurredAt: now.toISOString(), receivedAt: now.toISOString() }
        ];
      } else if (rand < 0.85) {
        status = CommunicationStatus.opened;
        events = [
          { eventId: `${campaign.id}:${customer.id}:sent`, type: "sent", occurredAt: now.toISOString(), receivedAt: now.toISOString() },
          { eventId: `${campaign.id}:${customer.id}:delivered`, type: "delivered", occurredAt: now.toISOString(), receivedAt: now.toISOString() },
          { eventId: `${campaign.id}:${customer.id}:opened`, type: "opened", occurredAt: now.toISOString(), receivedAt: now.toISOString() }
        ];
      } else if (rand < 0.95) {
        status = CommunicationStatus.clicked;
        events = [
          { eventId: `${campaign.id}:${customer.id}:sent`, type: "sent", occurredAt: now.toISOString(), receivedAt: now.toISOString() },
          { eventId: `${campaign.id}:${customer.id}:delivered`, type: "delivered", occurredAt: now.toISOString(), receivedAt: now.toISOString() },
          { eventId: `${campaign.id}:${customer.id}:opened`, type: "opened", occurredAt: now.toISOString(), receivedAt: now.toISOString() },
          { eventId: `${campaign.id}:${customer.id}:clicked`, type: "clicked", occurredAt: now.toISOString(), receivedAt: now.toISOString() }
        ];
      } else {
        status = CommunicationStatus.failed;
        events = [
          { eventId: `${campaign.id}:${customer.id}:sent`, type: "sent", occurredAt: now.toISOString(), receivedAt: now.toISOString() },
          { eventId: `${campaign.id}:${customer.id}:failed`, type: "failed", occurredAt: now.toISOString(), receivedAt: now.toISOString() }
        ];
      }

      return {
        campaignId: campaign.id,
        customerId: customer.id,
        channel: campaign.channel,
        recipient: this.resolveRecipient(customer, campaign.channel),
        status,
        idempotencyKey: `${campaign.id}:${customer.id}:${campaign.channel}`,
        events: events as unknown as Prisma.InputJsonValue,
        lastEventAt: now
      };
    });

    await this.campaignRepository.createCommunicationLogs(logs);

    let deliveredCount = 0;
    let openedCount = 0;
    let clickedCount = 0;
    let failedCount = 0;

    logs.forEach((log) => {
      if (log.status === CommunicationStatus.delivered) deliveredCount++;
      else if (log.status === CommunicationStatus.opened) openedCount++;
      else if (log.status === CommunicationStatus.clicked) clickedCount++;
      else if (log.status === CommunicationStatus.failed) failedCount++;
    });

    const campaignMetrics = {
      queued: 0,
      sent: audience.length,
      delivered: deliveredCount + openedCount + clickedCount,
      opened: openedCount + clickedCount,
      clicked: clickedCount,
      bounced: 0,
      failed: failedCount,
      unsubscribed: 0,
      converted: 0
    };

    await this.campaignRepository.update(campaign.id, {
      status: CampaignStatus.completed,
      segmentVersion: segment.version,
      audienceSnapshot: {
        segmentId: segment.id,
        segmentVersion: segment.version,
        audienceSize: audience.length,
        evaluatedAt: now.toISOString()
      },
      launchedAt: now,
      completedAt: now,
      metrics: campaignMetrics
    });

    return {
      campaignId: campaign.id,
      status: CampaignStatus.completed,
      audienceSize: audience.length,
      queuedCommunications: audience.length
    };
  }

  async getCampaignAnalytics(id: string): Promise<CampaignAnalytics> {
    await this.getCampaignById(id);
    const grouped = await this.campaignRepository.countCommunicationLogs(id);
    
    const rawMetrics = {
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

    for (const group of grouped) {
      if (group.status in rawMetrics) {
        rawMetrics[group.status] += group.count;
      }
    }

    const analytics: CampaignAnalytics = {
      campaignId: id,
      metrics: {
        queued: rawMetrics.queued,
        sent: rawMetrics.sent + rawMetrics.delivered + rawMetrics.opened + rawMetrics.clicked + rawMetrics.converted + rawMetrics.unsubscribed + rawMetrics.failed + rawMetrics.bounced,
        delivered: rawMetrics.delivered + rawMetrics.opened + rawMetrics.clicked + rawMetrics.converted + rawMetrics.unsubscribed,
        opened: rawMetrics.opened + rawMetrics.clicked + rawMetrics.converted,
        clicked: rawMetrics.clicked + rawMetrics.converted,
        bounced: rawMetrics.bounced,
        failed: rawMetrics.failed,
        unsubscribed: rawMetrics.unsubscribed,
        converted: rawMetrics.converted
      },
      rates: {
        deliveryRate: 0,
        openRate: 0,
        clickRate: 0,
        conversionRate: 0
      }
    };

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
