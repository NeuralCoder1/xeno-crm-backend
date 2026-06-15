import type { Prisma, SegmentStatus } from "@prisma/client";

export type RuleGroupOperator = "and" | "or";
export type RuleConditionOperator =
  | "eq"
  | "ne"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "in"
  | "nin"
  | "contains"
  | "exists"
  | "between";

export interface AudienceRuleCondition {
  field: string;
  operator: RuleConditionOperator;
  value?: unknown;
}

export interface AudienceRuleGroup {
  operator: RuleGroupOperator;
  conditions: AudienceRuleNode[];
}

export type AudienceRuleNode = AudienceRuleCondition | AudienceRuleGroup;

export interface CreateSegmentInput {
  name: string;
  description?: string;
  status?: SegmentStatus;
  rules: AudienceRuleGroup;
}

export interface UpdateSegmentInput {
  name?: string;
  description?: string;
  status?: SegmentStatus;
  rules?: AudienceRuleGroup;
}

export interface SegmentListQuery {
  status?: SegmentStatus;
}

export interface AudiencePreview {
  segmentId: string;
  estimatedAudienceSize: number;
  evaluatedAt: Date;
}

export type CustomerAudienceWhere = Prisma.CustomerWhereInput;
