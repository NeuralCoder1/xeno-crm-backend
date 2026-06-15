import { createClient, type RedisClientType } from "redis";
import { env } from "./env";

const globalForRedis = globalThis as unknown as {
  redis?: RedisClientType;
};

export const redisClient: RedisClientType =
  globalForRedis.redis ??
  createClient({
    url: env.REDIS_URL
  });

redisClient.on("error", (error) => {
  console.error("Redis connection error", error);
});

redisClient.on("reconnecting", () => {
  console.warn("Redis reconnecting");
});

if (env.NODE_ENV !== "production") {
  globalForRedis.redis = redisClient;
}

export async function connectRedis(): Promise<void> {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient.isOpen) {
    await redisClient.quit();
  }
}
