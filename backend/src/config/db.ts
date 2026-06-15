import { PrismaClient } from "@prisma/client";
import { env } from "./env";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === "production" ? ["error", "warn"] : ["query", "error", "warn"]
  });

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
