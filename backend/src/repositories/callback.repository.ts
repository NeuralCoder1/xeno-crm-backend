import { type CommunicationLog, type CommunicationStatus, type Prisma } from "@prisma/client";
import { prisma } from "../config/db";

export class CallbackRepository {
  findCommunicationById(id: string): Promise<CommunicationLog | null> {
    return prisma.communicationLog.findUnique({
      where: { id }
    });
  }

  updateCommunicationEvent(input: {
    id: string;
    status: CommunicationStatus;
    events: Prisma.InputJsonValue;
    lastEventAt: Date;
    errorCode: string | null;
    errorMessage: string | null;
  }): Promise<CommunicationLog> {
    return prisma.communicationLog.update({
      where: { id: input.id },
      data: {
        status: input.status,
        events: input.events,
        lastEventAt: input.lastEventAt,
        errorCode: input.errorCode,
        errorMessage: input.errorMessage
      }
    });
  }
}
