import { prisma } from "../config/db";
import { connectRedis, redisClient } from "../config/redis";

export interface HealthStatus {
  status: "ok" | "healthy";
  database: "connected" | "healthy";
  redis: "connected" | "unavailable";
  timestamp: string;
}

export class HealthService {
  async getHealth(): Promise<HealthStatus> {
    await prisma.$queryRaw`SELECT 1`;

    let redisStatus: "connected" | "unavailable" = "connected";
    try {
      await connectRedis();
      await redisClient.ping();
    } catch {
      redisStatus = "unavailable";
    }

    return {
      status: "healthy",
      database: "connected",
      redis: redisStatus,
      timestamp: new Date().toISOString()
    };
  }
}
