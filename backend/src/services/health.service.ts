import { prisma } from "../config/db";
import { connectRedis, redisClient } from "../config/redis";

export interface HealthStatus {
  status: "ok";
  database: "connected";
  redis: "connected";
  timestamp: string;
}

export class HealthService {
  async getHealth(): Promise<HealthStatus> {
    await prisma.$queryRaw`SELECT 1`;
    await connectRedis();
    await redisClient.ping();

    return {
      status: "ok",
      database: "connected",
      redis: "connected",
      timestamp: new Date().toISOString()
    };
  }
}
