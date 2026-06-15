import { OrderStatus } from "@prisma/client";
import { z } from "zod";

export const orderIdParamSchema = z.object({
  id: z.string().uuid("order id must be a valid UUID")
});

export const customerOrderHistoryParamSchema = z.object({
  id: z.string().uuid("customer id must be a valid UUID")
});

const orderItemSchema = z.object({
  sku: z.string().trim().min(1).max(80).optional(),
  name: z.string().trim().min(1, "item name is required").max(160),
  category: z.string().trim().min(1).max(80).optional(),
  quantity: z.number().int().positive("quantity must be positive"),
  unitPrice: z.number().min(0, "unitPrice cannot be negative")
});

export const createOrderSchema = z.object({
  customerId: z.string().uuid("customerId must be a valid UUID"),
  externalOrderId: z.string().trim().min(1).max(120).optional(),
  status: z.nativeEnum(OrderStatus).optional(),
  currency: z.string().trim().length(3, "currency must be a 3-letter ISO code"),
  subtotal: z.number().min(0, "subtotal cannot be negative"),
  discountTotal: z.number().min(0, "discountTotal cannot be negative").optional(),
  taxTotal: z.number().min(0, "taxTotal cannot be negative").optional(),
  shippingTotal: z.number().min(0, "shippingTotal cannot be negative").optional(),
  grandTotal: z.number().min(0, "grandTotal cannot be negative"),
  items: z.array(orderItemSchema).min(1, "at least one order item is required"),
  orderedAt: z.coerce.date(),
  metadata: z.record(z.unknown()).optional()
});

export const listOrdersQuerySchema = z.object({
  customerId: z.string().uuid("customerId must be a valid UUID").optional(),
  status: z.nativeEnum(OrderStatus).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional()
});

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus)
});
