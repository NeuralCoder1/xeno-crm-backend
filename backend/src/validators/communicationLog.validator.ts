import { Channel, CommunicationStatus } from "@prisma/client";
import { z } from "zod";

export const communicationLogIdParamSchema = z.object({
  id: z.string().uuid("communication log id must be a valid UUID")
});

export const listCommunicationLogsQuerySchema = z.object({
  campaignId: z.string().uuid("campaignId must be a valid UUID").optional(),
  customerId: z.string().uuid("customerId must be a valid UUID").optional(),
  status: z.nativeEnum(CommunicationStatus).optional(),
  channel: z.nativeEnum(Channel).optional()
});
