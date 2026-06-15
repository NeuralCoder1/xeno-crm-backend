import type { OrderStatus, Prisma } from "@prisma/client";

export interface OrderItemInput {
  sku?: string;
  name: string;
  category?: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateOrderInput {
  customerId: string;
  externalOrderId?: string;
  status?: OrderStatus;
  currency: string;
  subtotal: number;
  discountTotal?: number;
  taxTotal?: number;
  shippingTotal?: number;
  grandTotal: number;
  items: OrderItemInput[];
  orderedAt: string | Date;
  metadata?: Prisma.InputJsonValue;
}

export interface UpdateOrderStatusInput {
  status: OrderStatus;
}

export interface OrderListQuery {
  customerId?: string;
  status?: OrderStatus;
  from?: Date;
  to?: Date;
}
