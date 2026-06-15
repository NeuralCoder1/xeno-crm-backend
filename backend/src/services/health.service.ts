import { prisma } from "../config/db";

export interface HealthStatus {
  status: "healthy";
  database: "connected";
}

export class HealthService {
  async getHealth(): Promise<HealthStatus> {
    await prisma.$queryRaw`SELECT 1`;

    return {
      status: "healthy",
      database: "connected"
    };
  }
}
