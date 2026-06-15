import { OrderStatus, Prisma, type Order } from "@prisma/client";
import { CustomerRepository } from "../repositories/customer.repository";
import { OrderRepository } from "../repositories/order.repository";
import type { CreateOrderInput, OrderListQuery, UpdateOrderStatusInput } from "../types/order";
import { AppError } from "../utils/appError";

export class OrderService {
  constructor(
    private readonly orderRepository = new OrderRepository(),
    private readonly customerRepository = new CustomerRepository()
  ) {}

  async createOrder(input: CreateOrderInput): Promise<Order> {
    await this.ensureCustomerExists(input.customerId);

    try {
      const order = await this.orderRepository.create(this.toOrderCreateData(input));
      await this.recalculateCustomerAggregates(order.customerId);
      return order;
    } catch (error) {
      this.handleWriteError(error);
    }
  }

  getOrders(query: OrderListQuery = {}): Promise<Order[]> {
    return this.orderRepository.findAll(query);
  }

  async getOrderById(id: string): Promise<Order> {
    const order = await this.orderRepository.findById(id);

    if (!order) {
      throw new AppError("Order not found.", 404, "ORDER_NOT_FOUND");
    }

    return order;
  }

  async getCustomerOrders(customerId: string): Promise<Order[]> {
    await this.ensureCustomerExists(customerId);
    return this.orderRepository.findByCustomerId(customerId);
  }

  async updateOrderStatus(id: string, input: UpdateOrderStatusInput): Promise<Order> {
    const existing = await this.getOrderById(id);
    const order = await this.orderRepository.updateStatus(id, input.status);
    await this.recalculateCustomerAggregates(existing.customerId);
    return order;
  }

  private toOrderCreateData(input: CreateOrderInput): Prisma.OrderCreateInput {
    return {
      customer: {
        connect: {
          id: input.customerId
        }
      },
      externalOrderId: input.externalOrderId,
      status: input.status ?? OrderStatus.pending,
      currency: input.currency,
      subtotal: input.subtotal,
      discountTotal: input.discountTotal ?? 0,
      taxTotal: input.taxTotal ?? 0,
      shippingTotal: input.shippingTotal ?? 0,
      grandTotal: input.grandTotal,
      items: input.items as unknown as Prisma.InputJsonValue,
      orderedAt: new Date(input.orderedAt),
      metadata: input.metadata
    };
  }

  private async ensureCustomerExists(customerId: string): Promise<void> {
    const customer = await this.customerRepository.findById(customerId);

    if (!customer) {
      throw new AppError("Customer not found.", 404, "CUSTOMER_NOT_FOUND");
    }
  }

  private async recalculateCustomerAggregates(customerId: string): Promise<void> {
    const aggregate = await this.orderRepository.getCustomerCompletedOrderAggregate(customerId);

    await this.customerRepository.update(customerId, {
      lifetimeValue: aggregate.lifetimeValue,
      orderCount: aggregate.orderCount,
      lastOrderAt: aggregate.lastOrderAt
    });
  }

  private handleWriteError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError("Order with the same externalOrderId already exists.", 409, "ORDER_ALREADY_EXISTS", {
        target: error.meta?.target
      });
    }

    throw error;
  }
}
