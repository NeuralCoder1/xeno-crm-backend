import { OrderStatus, type Order, type Prisma } from "@prisma/client";
import { prisma } from "../config/db";
import type { OrderListQuery } from "../types/order";

export class OrderRepository {
  create(data: Prisma.OrderCreateInput): Promise<Order> {
    return prisma.order.create({ data });
  }

  findAll(query: OrderListQuery = {}): Promise<Order[]> {
    const where: Prisma.OrderWhereInput = {};

    if (query.customerId) where.customerId = query.customerId;
    if (query.status) where.status = query.status;
    if (query.from || query.to) {
      where.orderedAt = {
        gte: query.from,
        lte: query.to
      };
    }

    return prisma.order.findMany({
      where,
      orderBy: { orderedAt: "desc" }
    });
  }

  findById(id: string): Promise<Order | null> {
    return prisma.order.findUnique({
      where: { id }
    });
  }

  findByCustomerId(customerId: string): Promise<Order[]> {
    return prisma.order.findMany({
      where: { customerId },
      orderBy: { orderedAt: "desc" }
    });
  }

  updateStatus(id: string, status: OrderStatus): Promise<Order> {
    return prisma.order.update({
      where: { id },
      data: { status }
    });
  }

  async getCustomerCompletedOrderAggregate(customerId: string): Promise<{
    lifetimeValue: number;
    orderCount: number;
    lastOrderAt: Date | null;
  }> {
    const completedStatuses = [OrderStatus.paid, OrderStatus.fulfilled];
    const [sum, count, latest] = await Promise.all([
      prisma.order.aggregate({
        where: {
          customerId,
          status: { in: completedStatuses }
        },
        _sum: {
          grandTotal: true
        }
      }),
      prisma.order.count({
        where: {
          customerId,
          status: { in: completedStatuses }
        }
      }),
      prisma.order.findFirst({
        where: {
          customerId,
          status: { in: completedStatuses }
        },
        orderBy: {
          orderedAt: "desc"
        },
        select: {
          orderedAt: true
        }
      })
    ]);

    return {
      lifetimeValue: sum._sum.grandTotal?.toNumber() ?? 0,
      orderCount: count,
      lastOrderAt: latest?.orderedAt ?? null
    };
  }
}
