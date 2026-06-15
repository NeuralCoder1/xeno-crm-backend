import { CommunicationStatus, type Campaign, type CommunicationLog, type Prisma } from "@prisma/client";
import { prisma } from "../config/db";
import type { CampaignListQuery } from "../types/campaign";

export class CampaignRepository {
  create(data: Prisma.CampaignCreateInput): Promise<Campaign> {
    return prisma.campaign.create({ data });
  }

  findAll(query: CampaignListQuery = {}): Promise<Campaign[]> {
    return prisma.campaign.findMany({
      where: {
        status: query.status,
        channel: query.channel,
        segmentId: query.segmentId
      },
      orderBy: { createdAt: "desc" }
    });
  }

  async findAllPaginated(query: CampaignListQuery = {}, page = 1, limit = 20): Promise<{ items: Campaign[]; total: number }> {
    const where: Prisma.CampaignWhereInput = {
      status: query.status,
      channel: query.channel,
      segmentId: query.segmentId
    };

    const take = Math.min(limit ?? 20, 100);
    const skip = (Math.max(page ?? 1, 1) - 1) * take;

    const [items, total] = await Promise.all([
      prisma.campaign.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
      prisma.campaign.count({ where })
    ]);

    return { items, total };
  }

  findById(id: string): Promise<Campaign | null> {
    return prisma.campaign.findUnique({
      where: { id }
    });
  }

  update(id: string, data: Prisma.CampaignUpdateInput): Promise<Campaign> {
    return prisma.campaign.update({
      where: { id },
      data
    });
  }

  async createCommunicationLogs(data: Prisma.CommunicationLogCreateManyInput[]): Promise<void> {
    if (data.length === 0) {
      return;
    }

    await prisma.communicationLog.createMany({
      data,
      skipDuplicates: true
    });
  }

  findCommunicationLogsByCampaignId(campaignId: string): Promise<CommunicationLog[]> {
    return prisma.communicationLog.findMany({
      where: { campaignId },
      orderBy: { createdAt: "asc" }
    });
  }

  async countCommunicationLogs(campaignId: string): Promise<Array<{ status: CommunicationStatus; count: number }>> {
    const grouped = await prisma.communicationLog.groupBy({
      by: ["status"],
      where: { campaignId },
      _count: {
        status: true
      }
    });

    return grouped.map((group) => ({
      status: group.status,
      count: group._count.status
    }));
  }

  listCommunicationLogs(campaignId: string): Promise<CommunicationLog[]> {
    return prisma.communicationLog.findMany({
      where: { campaignId },
      orderBy: { createdAt: "desc" }
    });
  }
}
