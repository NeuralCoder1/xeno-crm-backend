import { CampaignStatus, CampaignType, Channel } from "@prisma/client";
import { z } from "zod";

export const campaignIdParamSchema = z.object({
  id: z.string().uuid("campaign id must be a valid UUID")
});

const contentSchema = z.record(z.unknown()).refine((value) => Object.keys(value).length > 0, {
  message: "content cannot be empty"
});

export const createCampaignSchema = z.object({
  name: z.string().trim().min(1, "name is required").max(160, "name is too long"),
  description: z.string().trim().max(500, "description is too long").optional(),
  type: z.nativeEnum(CampaignType),
  channel: z.nativeEnum(Channel),
  segmentId: z.string().uuid("segmentId must be a valid UUID"),
  templateId: z.string().trim().min(1).max(120).optional(),
  content: contentSchema,
  scheduledAt: z.coerce.date().nullable().optional()
});

export const updateCampaignSchema = createCampaignSchema
  .partial()
  .extend({
    status: z.nativeEnum(CampaignStatus).optional()
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "at least one field is required"
  });

export const listCampaignsQuerySchema = z.object({
  status: z.nativeEnum(CampaignStatus).optional(),
  channel: z.nativeEnum(Channel).optional(),
  segmentId: z.string().uuid("segmentId must be a valid UUID").optional()
});
