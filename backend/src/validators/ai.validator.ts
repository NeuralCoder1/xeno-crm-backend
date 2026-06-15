import { z } from "zod";

export const generateSegmentSchema = z.object({
  prompt: z.string().min(1, "prompt is required")
});

export const generateMessageSchema = z.object({
  campaignType: z.string().min(1, "campaignType is required"),
  objective: z.string().min(1, "objective is required")
});

export const recommendChannelSchema = z.object({
  campaignType: z.string().min(1, "campaignType is required"),
  audienceSize: z.coerce.number().int().min(0)
});

export const copilotSchema = z.object({
  prompt: z.string().min(1, "prompt is required")
});
