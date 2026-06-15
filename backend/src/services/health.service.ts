import { prisma } from "../config/db";
import { connectRedis, redisClient } from "../config/redis";

export interface HealthStatus {
  status: "ok";
  database: "healthy";
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
      status: "ok",
      database: "healthy",
      redis: redisStatus,
      timestamp: new Date().toISOString()
    };
  }
}
