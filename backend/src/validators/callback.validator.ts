import { CommunicationStatus } from "@prisma/client";
import { z } from "zod";

export const channelEventSchema = z.object({
  eventId: z.string().trim().min(1, "eventId is required"),
  communicationId: z.string().uuid("communicationId must be a valid UUID"),
  status: z.nativeEnum(CommunicationStatus),
  timestamp: z.coerce.date(),
  metadata: z.record(z.unknown()).optional()
});
