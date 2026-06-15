import { CommunicationStatus, Prisma, type CommunicationLog } from "@prisma/client";
import { CommunicationLogRepository } from "../repositories/communicationLog.repository";
import type { CommunicationLogListQuery, RetryCommunicationResult } from "../types/communicationLog";
import { AppError } from "../utils/appError";
import { ChannelServiceClient } from "./channelServiceClient.service";

const retryBackoffMs = [5000, 15000, 30000] as const;
const maxRetryAttempts = retryBackoffMs.length;

interface StoredCommunicationEvent {
  eventId: string;
  type: string;
  occurredAt: string;
  receivedAt: string;
  metadata?: unknown;
}

export class CommunicationLogService {
  constructor(
    private readonly communicationLogRepository = new CommunicationLogRepository(),
    private readonly channelServiceClient = new ChannelServiceClient()
  ) {}

  getCommunicationLogs(query: CommunicationLogListQuery = {}): Promise<CommunicationLog[]> {
    return this.communicationLogRepository.findAll(query);
  }

  async getCommunicationLogById(id: string): Promise<CommunicationLog> {
    const communicationLog = await this.communicationLogRepository.findById(id);

    if (!communicationLog) {
      throw new AppError("Communication log not found.", 404, "COMMUNICATION_LOG_NOT_FOUND");
    }

    return communicationLog;
  }

  async retryCommunication(id: string): Promise<RetryCommunicationResult> {
    const communicationLog = await this.communicationLogRepository.findByIdWithCampaign(id);

    if (!communicationLog) {
      throw new AppError("Communication log not found.", 404, "COMMUNICATION_LOG_NOT_FOUND");
    }

    this.assertRetryAllowed(communicationLog.status);

    const existingEvents = this.parseEvents(communicationLog.events);
    const retryAttempt = this.nextRetryAttempt(existingEvents);
    const retryDelayMs = retryBackoffMs[retryAttempt - 1];
    const now = new Date();
    const scheduledEvent = this.retryEvent("retry_scheduled", communicationLog.id, retryAttempt, now, {
      delaySeconds: retryDelayMs / 1000
    });

    await this.communicationLogRepository.updateRetryState({
      id: communicationLog.id,
      status: CommunicationStatus.queued,
      events: [...existingEvents, scheduledEvent] as unknown as Prisma.InputJsonValue,
      lastEventAt: now,
      errorCode: null,
      errorMessage: null
    });

    setTimeout(() => {
      void this.dispatchRetry(communicationLog.id, retryAttempt);
    }, retryDelayMs);

    return {
      communicationId: communicationLog.id,
      status: CommunicationStatus.queued,
      retryAttempt,
      retryDelaySeconds: retryDelayMs / 1000
    };
  }

  private assertRetryAllowed(status: CommunicationStatus): void {
    if (
      status === CommunicationStatus.delivered ||
      status === CommunicationStatus.opened ||
      status === CommunicationStatus.clicked ||
      status === CommunicationStatus.converted
    ) {
      throw new AppError("Communication has already reached a successful terminal state.", 400, "COMMUNICATION_RETRY_NOT_ALLOWED");
    }

    if (status !== CommunicationStatus.failed) {
      throw new AppError("Only failed communications can be retried.", 400, "COMMUNICATION_RETRY_NOT_ALLOWED");
    }
  }

  private nextRetryAttempt(events: StoredCommunicationEvent[]): number {
    const retryAttempts = events
      .filter((event) => event.type === "retry_scheduled")
      .map((event) => this.retryAttemptFromEvent(event))
      .filter((attempt): attempt is number => attempt !== null);
    const nextAttempt = retryAttempts.length === 0 ? 1 : Math.max(...retryAttempts) + 1;

    if (nextAttempt > maxRetryAttempts) {
      throw new AppError("Communication retry limit exceeded.", 400, "COMMUNICATION_RETRY_LIMIT_EXCEEDED");
    }

    return nextAttempt;
  }

  private async dispatchRetry(communicationId: string, retryAttempt: number): Promise<void> {
    const communicationLog = await this.communicationLogRepository.findByIdWithCampaign(communicationId);

    if (!communicationLog) {
      return;
    }

    if (communicationLog.status !== CommunicationStatus.queued && communicationLog.status !== CommunicationStatus.failed) {
      return;
    }

    const existingEvents = this.parseEvents(communicationLog.events);
    const dispatchedEventId = this.retryEventId(communicationLog.id, retryAttempt, "retry_dispatched");

    if (existingEvents.some((event) => event.eventId === dispatchedEventId)) {
      return;
    }

    const dispatchedAt = new Date();
    const dispatchedEvent = this.retryEvent("retry_dispatched", communicationLog.id, retryAttempt, dispatchedAt);

    await this.communicationLogRepository.updateRetryState({
      id: communicationLog.id,
      status: CommunicationStatus.queued,
      events: [...existingEvents, dispatchedEvent] as unknown as Prisma.InputJsonValue,
      lastEventAt: dispatchedAt,
      errorCode: null,
      errorMessage: null
    });

    try {
      await this.channelServiceClient.send({
        communicationId: communicationLog.id,
        campaignId: communicationLog.campaignId,
        customerId: communicationLog.customerId,
        recipient: communicationLog.recipient,
        channel: communicationLog.channel,
        content: communicationLog.campaign.content,
        attempt: retryAttempt
      });
    } catch (error) {
      await this.recordRetryDispatchFailure(communicationLog.id, retryAttempt, error);
    }
  }

  private async recordRetryDispatchFailure(communicationId: string, retryAttempt: number, error: unknown): Promise<void> {
    const communicationLog = await this.communicationLogRepository.findById(communicationId);

    if (!communicationLog) {
      return;
    }

    const existingEvents = this.parseEvents(communicationLog.events);
    const failedAt = new Date();
    const failedEvent = this.retryEvent("retry_dispatch_failed", communicationLog.id, retryAttempt, failedAt, {
      errorMessage: error instanceof Error ? error.message : "Unknown channel dispatch failure."
    });

    await this.communicationLogRepository.updateRetryState({
      id: communicationLog.id,
      status: CommunicationStatus.failed,
      events: [...existingEvents, failedEvent] as unknown as Prisma.InputJsonValue,
      lastEventAt: failedAt,
      errorCode: "CHANNEL_RETRY_DISPATCH_FAILED",
      errorMessage: error instanceof Error ? error.message : "Unknown channel dispatch failure."
    });
  }

  private retryEvent(
    type: "retry_scheduled" | "retry_dispatched" | "retry_dispatch_failed",
    communicationId: string,
    retryAttempt: number,
    occurredAt: Date,
    metadata: Record<string, unknown> = {}
  ): StoredCommunicationEvent {
    return {
      eventId: this.retryEventId(communicationId, retryAttempt, type),
      type,
      occurredAt: occurredAt.toISOString(),
      receivedAt: new Date().toISOString(),
      metadata: {
        retryAttempt,
        ...metadata
      }
    };
  }

  private retryEventId(communicationId: string, retryAttempt: number, type: string): string {
    return `${communicationId}:retry-${retryAttempt}:${type}`;
  }

  private retryAttemptFromEvent(event: StoredCommunicationEvent): number | null {
    if (!event.metadata || typeof event.metadata !== "object" || !("retryAttempt" in event.metadata)) {
      return null;
    }

    const retryAttempt = event.metadata.retryAttempt;
    return typeof retryAttempt === "number" && Number.isInteger(retryAttempt) ? retryAttempt : null;
  }

  private parseEvents(events: Prisma.JsonValue): StoredCommunicationEvent[] {
    if (!Array.isArray(events)) {
      return [];
    }

    const parsedEvents: StoredCommunicationEvent[] = [];

    for (const event of events) {
      if (
        event &&
        typeof event === "object" &&
        "eventId" in event &&
        typeof event.eventId === "string" &&
        "type" in event &&
        typeof event.type === "string" &&
        "occurredAt" in event &&
        typeof event.occurredAt === "string" &&
        "receivedAt" in event &&
        typeof event.receivedAt === "string"
      ) {
        parsedEvents.push({
          eventId: event.eventId,
          type: event.type,
          occurredAt: event.occurredAt,
          receivedAt: event.receivedAt,
          metadata: "metadata" in event ? event.metadata : undefined
        });
      }
    }

    return parsedEvents;
  }
}
