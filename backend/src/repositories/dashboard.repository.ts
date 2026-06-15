import { prisma } from "../config/db";

export interface DashboardSummary {
  customers: number;
  orders: number;
  segments: number;
  campaigns: number;
  communicationLogs: number;
}

export class DashboardRepository {
  async getSummary(): Promise<DashboardSummary> {
    const [customers, orders, segments, campaigns, communicationLogs] = await Promise.all([
      prisma.customer.count(),
      prisma.order.count(),
      prisma.segment.count(),
      prisma.campaign.count(),
      prisma.communicationLog.count()
    ]);

    return {
      customers,
      orders,
      segments,
      campaigns,
      communicationLogs
    };
  }
}
