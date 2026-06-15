import type { CommunicationStatus, Prisma } from "@prisma/client";

export interface ChannelEventInput {
  eventId: string;
  communicationId: string;
  status: CommunicationStatus;
  timestamp: Date;
  metadata?: Prisma.InputJsonValue;
}

export interface ChannelEventResult {
  eventId: string;
  processed: boolean;
  reason?: "duplicate_event" | "stale_event";
}
