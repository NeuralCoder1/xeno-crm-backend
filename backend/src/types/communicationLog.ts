import type { Channel, CommunicationStatus } from "@prisma/client";

export interface CommunicationLogListQuery {
  campaignId?: string;
  customerId?: string;
  status?: CommunicationStatus;
  channel?: Channel;
  page?: number;
  limit?: number;
}

export interface RetryCommunicationResult {
  communicationId: string;
  status: CommunicationStatus;
  retryAttempt: number;
  retryDelaySeconds: number;
}
