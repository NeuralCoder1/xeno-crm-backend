import type { Campaign, CommunicationLog, CommunicationStatus, Prisma } from "@prisma/client";
import { prisma } from "../config/db";
import type { CommunicationLogListQuery } from "../types/communicationLog";

export type CommunicationLogWithCampaign = CommunicationLog & {
  campaign: Pick<Campaign, "content">;
};

export class CommunicationLogRepository {
  findAll(query: CommunicationLogListQuery = {}): Promise<CommunicationLog[]> {
    const where: Prisma.CommunicationLogWhereInput = {
      campaignId: query.campaignId,
      customerId: query.customerId,
      status: query.status,
      channel: query.channel
    };

    return prisma.communicationLog.findMany({
      where,
      orderBy: {
        createdAt: "desc"
      }
    });
  }

  async findAllPaginated(query: CommunicationLogListQuery = {}, page = 1, limit = 20): Promise<{ items: CommunicationLog[]; total: number }> {
    const where: Prisma.CommunicationLogWhereInput = {
      campaignId: query.campaignId,
      customerId: query.customerId,
      status: query.status,
      channel: query.channel
    };

    const take = Math.min(limit ?? 20, 100);
    const skip = (Math.max(page ?? 1, 1) - 1) * take;

    const [items, total] = await Promise.all([
      prisma.communicationLog.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
      prisma.communicationLog.count({ where })
    ]);

    return { items, total };
  }

  findById(id: string): Promise<CommunicationLog | null> {
    return prisma.communicationLog.findUnique({
      where: { id }
    });
  }

  findByIdWithCampaign(id: string): Promise<CommunicationLogWithCampaign | null> {
    return prisma.communicationLog.findUnique({
      where: { id },
      include: {
        campaign: {
          select: {
            content: true
          }
        }
      }
    });
  }

  updateRetryState(input: {
    id: string;
    status: CommunicationStatus;
    events: Prisma.InputJsonValue;
    lastEventAt: Date;
    errorCode?: string | null;
    errorMessage?: string | null;
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
