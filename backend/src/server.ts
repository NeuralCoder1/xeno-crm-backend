import type { Server } from "http";
import { prisma } from "./config/db";
import { connectRedis, disconnectRedis, redisClient } from "./config/redis";
import { env } from "./config/env";
import { app } from "./app";

let server: Server | undefined;
let isShuttingDown = false;

async function verifyDependencies(): Promise<void> {
  await prisma.$queryRaw`SELECT 1`;

  try {
    await connectRedis();
    await redisClient.ping();
    console.log("Redis connected");
  } catch (error) {
    console.warn("Redis unavailable. Continuing without Redis.");
  }
}

async function shutdown(signal: NodeJS.Signals): Promise<void> {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  console.info(`Received ${signal}. Shutting down HTTP server.`);

  if (server) {
    await new Promise<void>((resolve, reject) => {
      server?.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }

  await disconnectRedis();
  await prisma.$disconnect();
  process.exit(0);
}

async function startServer(): Promise<void> {
  await verifyDependencies();

  server = app.listen(env.PORT, () => {
    console.info(`CRM backend listening on port ${env.PORT}`);
  });
}

process.on("SIGINT", (signal) => {
  void shutdown(signal);
});

process.on("SIGTERM", (signal) => {
  void shutdown(signal);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection", reason);
  void shutdown("SIGTERM");
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception", error);
  void shutdown("SIGTERM");
});

void startServer().catch((error) => {
  console.error("Failed to start CRM backend", error);
  process.exit(1);
});
