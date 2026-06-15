import { z } from "zod";
import { CustomerStatus } from "@prisma/client";

const trimmedString = z.string().trim().min(1);
const optionalEmail = z.string().trim().email("email must be valid").max(254, "email is too long").optional();
const attributesSchema = z.record(z.unknown()).optional();
const consentSchema = z
  .object({
    email: z.boolean().optional(),
    sms: z.boolean().optional(),
    whatsapp: z.boolean().optional(),
    push: z.boolean().optional(),
    rcs: z.boolean().optional()
  })
  .optional();

const customerBodySchema = z.object({
  firstName: trimmedString.max(80, "firstName is too long").optional(),
  lastName: trimmedString.max(80, "lastName is too long").optional(),
  name: trimmedString.max(160, "name is too long").optional(),
  email: optionalEmail,
  phone: trimmedString.max(32, "phone is too long").optional(),
  externalId: trimmedString.max(120, "externalId is too long").optional(),
  status: z.nativeEnum(CustomerStatus).optional(),
  attributes: attributesSchema,
  lifetimeValue: z.number().min(0, "lifetimeValue cannot be negative").optional(),
  totalSpend: z.number().min(0, "totalSpend cannot be negative").optional(),
  orderCount: z.number().int().min(0, "orderCount cannot be negative").optional(),
  consent: consentSchema,
  source: trimmedString.max(80, "source is too long").optional()
});

export const customerIdParamSchema = z.object({
  id: z.string().uuid("customer id must be a valid UUID")
});

export const listCustomersQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
  status: z.nativeEnum(CustomerStatus).optional()
});

export const createCustomerSchema = customerBodySchema.refine((data) => data.email || data.phone, {
    message: "email or phone is required",
    path: ["email"]
  });

export const updateCustomerSchema = customerBodySchema.partial().refine((data) => Object.keys(data).length > 0, {
  message: "at least one field is required"
});

export type CreateCustomerSchema = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerSchema = z.infer<typeof updateCustomerSchema>;
