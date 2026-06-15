import type { CampaignStatus, CampaignType, Channel, Prisma } from "@prisma/client";

export interface CreateCampaignInput {
  name: string;
  description?: string;
  type: CampaignType;
  channel: Channel;
  segmentId: string;
  templateId?: string;
  content: Prisma.InputJsonValue;
  scheduledAt?: string | Date | null;
}

export interface UpdateCampaignInput {
  name?: string;
  description?: string;
  type?: CampaignType;
  channel?: Channel;
  segmentId?: string;
  templateId?: string | null;
  content?: Prisma.InputJsonValue;
  scheduledAt?: string | Date | null;
  status?: CampaignStatus;
}

export interface CampaignListQuery {
  status?: CampaignStatus;
  channel?: Channel;
  segmentId?: string;
  page?: number;
  limit?: number;
}

export interface CampaignAnalytics {
  campaignId: string;
  metrics: {
    queued: number;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    failed: number;
    unsubscribed: number;
    converted: number;
  };
  rates: {
    deliveryRate: number;
    openRate: number;
    clickRate: number;
    conversionRate: number;
  };
}
