import { SegmentStatus } from "@prisma/client";
import { z } from "zod";

const conditionOperatorSchema = z.enum(["eq", "ne", "gt", "gte", "lt", "lte", "in", "nin", "contains", "exists", "between"]);
const ruleGroupOperatorSchema = z.enum(["and", "or"]);

type RuleNodeInput = {
  operator: "and" | "or";
  conditions: RuleNodeInput[];
} | {
  field: string;
  operator: z.infer<typeof conditionOperatorSchema>;
  value?: unknown;
};

const ruleConditionSchema = z
  .object({
    field: z.string().trim().min(1, "field is required"),
    operator: conditionOperatorSchema,
    value: z.unknown().optional()
  })
  .superRefine((condition, context) => {
    const valueRequiredOperators = ["eq", "ne", "gt", "gte", "lt", "lte", "in", "nin", "contains", "between"];

    if (valueRequiredOperators.includes(condition.operator) && condition.value === undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "value is required for this operator",
        path: ["value"]
      });
    }
  });

const ruleNodeSchema: z.ZodType<RuleNodeInput> = z.lazy(() =>
  z.union([
    ruleConditionSchema,
    z.object({
      operator: ruleGroupOperatorSchema,
      conditions: z.array(ruleNodeSchema).min(1, "conditions must contain at least one rule")
    })
  ])
);

export const segmentRulesSchema = z.object({
  operator: ruleGroupOperatorSchema,
  conditions: z.array(ruleNodeSchema).min(1, "conditions must contain at least one rule")
});

export const segmentIdParamSchema = z.object({
  id: z.string().uuid("segment id must be a valid UUID")
});

export const listSegmentsQuerySchema = z.object({
  status: z.nativeEnum(SegmentStatus).optional()
});

export const createSegmentSchema = z.object({
  name: z.string().trim().min(1, "name is required").max(160, "name is too long"),
  description: z.string().trim().max(500, "description is too long").optional(),
  status: z.nativeEnum(SegmentStatus).optional(),
  rules: segmentRulesSchema
});

export const updateSegmentSchema = createSegmentSchema.partial().refine((data) => Object.keys(data).length > 0, {
  message: "at least one field is required"
});
