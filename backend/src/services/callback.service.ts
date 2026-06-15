import { CommunicationStatus, Prisma } from "@prisma/client";
import { CallbackRepository } from "../repositories/callback.repository";
import type { ChannelEventInput, ChannelEventResult } from "../types/callback";
import { AppError } from "../utils/appError";

interface StoredCommunicationEvent {
  eventId: string;
  type: string;
  occurredAt: string;
  receivedAt: string;
  metadata?: unknown;
}

export class CallbackService {
  constructor(private readonly callbackRepository = new CallbackRepository()) {}

  async handleChannelEvent(input: ChannelEventInput): Promise<ChannelEventResult> {
    const communication = await this.callbackRepository.findCommunicationById(input.communicationId);

    if (!communication) {
      throw new AppError("Communication log not found.", 404, "COMMUNICATION_LOG_NOT_FOUND");
    }

    const existingEvents = this.parseEvents(communication.events);

    if (existingEvents.some((event) => event.eventId === input.eventId)) {
      return {
        eventId: input.eventId,
        processed: false,
        reason: "duplicate_event"
      };
    }

    if (communication.lastEventAt && input.timestamp <= communication.lastEventAt) {
      return {
        eventId: input.eventId,
        processed: false,
        reason: "stale_event"
      };
    }

    const nextEvent: StoredCommunicationEvent = {
      eventId: input.eventId,
      type: input.status,
      occurredAt: input.timestamp.toISOString(),
      receivedAt: new Date().toISOString(),
      metadata: input.metadata
    };
    const nextEvents = [...existingEvents, nextEvent];

    await this.callbackRepository.updateCommunicationEvent({
      id: input.communicationId,
      status: input.status,
      events: nextEvents as unknown as Prisma.InputJsonValue,
      lastEventAt: input.timestamp,
      errorCode: input.status === CommunicationStatus.failed ? "CHANNEL_DELIVERY_FAILED" : null,
      errorMessage: input.status === CommunicationStatus.failed ? "Channel service reported delivery failure." : null
    });

    return {
      eventId: input.eventId,
      processed: true
    };
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
