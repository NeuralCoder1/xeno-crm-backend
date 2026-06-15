import { prisma } from "../config/db";
import type { Prisma } from "@prisma/client";

export class AIRepository {
  async createAISession(data: Prisma.AISessionCreateInput) {
    return prisma.aISession.create({ data });
  }
}

export default AIRepository;
