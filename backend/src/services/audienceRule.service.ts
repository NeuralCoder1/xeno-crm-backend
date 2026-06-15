import { CustomerStatus, OrderStatus, Prisma } from "@prisma/client";
import type { AudienceRuleCondition, AudienceRuleGroup, AudienceRuleNode, CustomerAudienceWhere } from "../types/segment";
import { AppError } from "../utils/appError";

type FieldType = "string" | "number" | "date" | "boolean" | "customerStatus" | "orderStatus" | "jsonString";

interface FieldDefinition {
  type: FieldType;
  customerField?: keyof Prisma.CustomerWhereInput;
  orderField?: keyof Prisma.OrderWhereInput;
  jsonPath?: string[];
}

export class AudienceRuleService {
  buildCustomerWhere(rules: AudienceRuleGroup): CustomerAudienceWhere {
    return {
      status: {
        not: CustomerStatus.deleted
      },
      ...this.parseGroup(rules)
    };
  }

  private parseNode(node: AudienceRuleNode): CustomerAudienceWhere {
    if (this.isGroup(node)) {
      return this.parseGroup(node);
    }

    return this.parseCondition(node);
  }

  private parseGroup(group: AudienceRuleGroup): CustomerAudienceWhere {
    const parsedConditions = group.conditions.map((condition) => this.parseNode(condition));

    if (parsedConditions.length === 0) {
      throw new AppError("Audience rule group must contain at least one condition.", 422, "INVALID_AUDIENCE_RULE");
    }

    return group.operator === "and" ? { AND: parsedConditions } : { OR: parsedConditions };
  }

  private parseCondition(condition: AudienceRuleCondition): CustomerAudienceWhere {
    const field = this.resolveField(condition.field);

    if (field.orderField) {
      return {
        orders: {
          some: this.buildOrderFilter(field, condition)
        }
      };
    }

    if (field.jsonPath) {
      return this.buildJsonWhere(field, condition);
    }

    if (!field.customerField) {
      throw new AppError(`Unsupported audience field: ${condition.field}`, 422, "INVALID_AUDIENCE_RULE");
    }

    return {
      [field.customerField]: this.buildScalarFilter(field.type, condition)
    };
  }

  private buildOrderFilter(field: FieldDefinition, condition: AudienceRuleCondition): Prisma.OrderWhereInput {
    if (!field.orderField) {
      throw new AppError(`Unsupported order audience field: ${condition.field}`, 422, "INVALID_AUDIENCE_RULE");
    }

    return {
      [field.orderField]: this.buildScalarFilter(field.type, condition)
    };
  }

  private buildScalarFilter(type: FieldType, condition: AudienceRuleCondition): unknown {
    switch (condition.operator) {
      case "eq":
        return { equals: this.coerceValue(type, condition.value) };
      case "ne":
        return { not: this.coerceValue(type, condition.value) };
      case "gt":
        return { gt: this.coerceValue(type, condition.value) };
      case "gte":
        return { gte: this.coerceValue(type, condition.value) };
      case "lt":
        return { lt: this.coerceValue(type, condition.value) };
      case "lte":
        return { lte: this.coerceValue(type, condition.value) };
      case "in":
        return { in: this.coerceArray(type, condition.value) };
      case "nin":
        return { notIn: this.coerceArray(type, condition.value) };
      case "contains":
        this.assertFieldType(type, ["string"]);
        return { contains: this.requireString(condition.value), mode: "insensitive" };
      case "between": {
        const [from, to] = this.coerceTuple(type, condition.value);
        return { gte: from, lte: to };
      }
      case "exists":
        return this.buildExistsFilter(condition.value);
      default:
        throw new AppError(`Unsupported audience operator: ${condition.operator}`, 422, "INVALID_AUDIENCE_RULE");
    }
  }

  private buildJsonWhere(field: FieldDefinition, condition: AudienceRuleCondition): CustomerAudienceWhere {
    if (!field.jsonPath) {
      throw new AppError(`Unsupported JSON audience field: ${condition.field}`, 422, "INVALID_AUDIENCE_RULE");
    }

    switch (condition.operator) {
      case "eq":
        return { attributes: { path: field.jsonPath, equals: this.toJsonValue(condition.value) } };
      case "ne":
        return { attributes: { path: field.jsonPath, not: this.toJsonValue(condition.value) } };
      case "in":
        return {
          OR: this.coerceJsonArray(condition.value).map((value) => ({
            attributes: { path: field.jsonPath, equals: value }
          }))
        };
      case "nin":
        return {
          NOT: this.coerceJsonArray(condition.value).map((value) => ({
            attributes: { path: field.jsonPath, equals: value }
          }))
        };
      case "contains":
        return { attributes: { path: field.jsonPath, string_contains: this.requireString(condition.value) } };
      case "exists":
        return condition.value === false
          ? { attributes: { path: field.jsonPath, equals: Prisma.JsonNull } }
          : { attributes: { path: field.jsonPath, not: Prisma.JsonNull } };
      default:
        throw new AppError(`Operator ${condition.operator} is not supported for JSON audience fields.`, 422, "INVALID_AUDIENCE_RULE");
    }
  }

  private buildExistsFilter(value: unknown): unknown {
    return value === false ? { equals: null } : { not: null };
  }

  private resolveField(field: string): FieldDefinition {
    const normalized = field.trim();

    const customerFields: Record<string, FieldDefinition> = {
      "customer.firstName": { type: "string", customerField: "firstName" },
      "customer.lastName": { type: "string", customerField: "lastName" },
      "customer.email": { type: "string", customerField: "email" },
      "customer.phone": { type: "string", customerField: "phone" },
      "customer.externalId": { type: "string", customerField: "externalId" },
      "customer.status": { type: "customerStatus", customerField: "status" },
      "customer.source": { type: "string", customerField: "source" },
      "customer.lifetimeValue": { type: "number", customerField: "lifetimeValue" },
      "customer.orderCount": { type: "number", customerField: "orderCount" },
      "customer.lastOrderAt": { type: "date", customerField: "lastOrderAt" },
      "customer.createdAt": { type: "date", customerField: "createdAt" },
      "customer.consent.email": { type: "boolean", customerField: "consentEmail" },
      "customer.consent.sms": { type: "boolean", customerField: "consentSms" },
      "customer.consent.whatsapp": { type: "boolean", customerField: "consentWhatsapp" },
      "customer.consent.push": { type: "boolean", customerField: "consentPush" },
      "customer.consent.rcs": { type: "boolean", customerField: "consentRcs" },
      "order.grandTotal": { type: "number", orderField: "grandTotal" },
      "order.status": { type: "orderStatus", orderField: "status" },
      "order.orderedAt": { type: "date", orderField: "orderedAt" }
    };

    if (customerFields[normalized]) {
      return customerFields[normalized];
    }

    if (normalized.startsWith("customer.attributes.")) {
      const attributePath = normalized.replace("customer.attributes.", "").split(".").filter(Boolean);

      if (attributePath.length === 0) {
        throw new AppError("Customer attribute field path is invalid.", 422, "INVALID_AUDIENCE_RULE");
      }

      return {
        type: "jsonString",
        jsonPath: attributePath
      };
    }

    throw new AppError(`Unsupported audience field: ${field}`, 422, "INVALID_AUDIENCE_RULE");
  }

  private coerceValue(type: FieldType, value: unknown): unknown {
    switch (type) {
      case "number":
        return this.requireNumber(value);
      case "date":
        return this.requireDate(value);
      case "boolean":
        return this.requireBoolean(value);
      case "customerStatus":
        return this.requireCustomerStatus(value);
      case "orderStatus":
        return this.requireOrderStatus(value);
      case "string":
      case "jsonString":
        return this.requireString(value);
      default:
        throw new AppError("Unsupported audience field type.", 422, "INVALID_AUDIENCE_RULE");
    }
  }

  private coerceArray(type: FieldType, value: unknown): unknown[] {
    if (!Array.isArray(value) || value.length === 0) {
      throw new AppError("Audience operator requires a non-empty array value.", 422, "INVALID_AUDIENCE_RULE");
    }

    return value.map((item) => this.coerceValue(type, item));
  }

  private coerceTuple(type: FieldType, value: unknown): [unknown, unknown] {
    if (!Array.isArray(value) || value.length !== 2) {
      throw new AppError("Audience between operator requires exactly two values.", 422, "INVALID_AUDIENCE_RULE");
    }

    return [this.coerceValue(type, value[0]), this.coerceValue(type, value[1])];
  }

  private coerceJsonArray(value: unknown): Prisma.InputJsonValue[] {
    if (!Array.isArray(value) || value.length === 0) {
      throw new AppError("Audience operator requires a non-empty array value.", 422, "INVALID_AUDIENCE_RULE");
    }

    return value.map((item) => this.toJsonValue(item));
  }

  private assertFieldType(type: FieldType, allowed: FieldType[]): void {
    if (!allowed.includes(type)) {
      throw new AppError("Audience operator is not supported for this field type.", 422, "INVALID_AUDIENCE_RULE");
    }
  }

  private requireString(value: unknown): string {
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new AppError("Audience rule value must be a non-empty string.", 422, "INVALID_AUDIENCE_RULE");
    }

    return value.trim();
  }

  private requireNumber(value: unknown): number {
    if (typeof value !== "number" || Number.isNaN(value)) {
      throw new AppError("Audience rule value must be a number.", 422, "INVALID_AUDIENCE_RULE");
    }

    return value;
  }

  private requireBoolean(value: unknown): boolean {
    if (typeof value !== "boolean") {
      throw new AppError("Audience rule value must be a boolean.", 422, "INVALID_AUDIENCE_RULE");
    }

    return value;
  }

  private requireDate(value: unknown): Date {
    if (typeof value !== "string" && !(value instanceof Date)) {
      throw new AppError("Audience rule value must be a date.", 422, "INVALID_AUDIENCE_RULE");
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new AppError("Audience rule value must be a valid date.", 422, "INVALID_AUDIENCE_RULE");
    }

    return date;
  }

  private requireCustomerStatus(value: unknown): CustomerStatus {
    if (typeof value === "string" && Object.values(CustomerStatus).includes(value as CustomerStatus)) {
      return value as CustomerStatus;
    }

    throw new AppError("Audience rule value must be a valid customer status.", 422, "INVALID_AUDIENCE_RULE");
  }

  private requireOrderStatus(value: unknown): OrderStatus {
    if (typeof value === "string" && Object.values(OrderStatus).includes(value as OrderStatus)) {
      return value as OrderStatus;
    }

    throw new AppError("Audience rule value must be a valid order status.", 422, "INVALID_AUDIENCE_RULE");
  }

  private toJsonValue(value: unknown): Prisma.InputJsonValue {
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      return value;
    }

    throw new AppError("Audience JSON rule value must be a string, number, or boolean.", 422, "INVALID_AUDIENCE_RULE");
  }

  private isGroup(node: AudienceRuleNode): node is AudienceRuleGroup {
    return "conditions" in node;
  }
}
