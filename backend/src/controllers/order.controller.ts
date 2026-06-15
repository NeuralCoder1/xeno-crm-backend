import type { Request, Response } from "express";
import { OrderService } from "../services/order.service";
import type { CreateOrderInput, OrderListQuery, UpdateOrderStatusInput } from "../types/order";

export class OrderController {
  constructor(private readonly orderService = new OrderService()) {}

  createOrder = async (req: Request, res: Response): Promise<void> => {
    const order = await this.orderService.createOrder(req.body as CreateOrderInput);

    res.status(201).json({
      success: true,
      data: order
    });
  };

  getOrders = async (req: Request, res: Response): Promise<void> => {
    const orders = await this.orderService.getOrders(req.query as OrderListQuery);

    res.status(200).json({
      success: true,
      data: orders
    });
  };

  getOrderById = async (req: Request, res: Response): Promise<void> => {
    const order = await this.orderService.getOrderById(req.params.id);

    res.status(200).json({
      success: true,
      data: order
    });
  };

  getCustomerOrders = async (req: Request, res: Response): Promise<void> => {
    const orders = await this.orderService.getCustomerOrders(req.params.id);

    res.status(200).json({
      success: true,
      data: orders
    });
  };

  updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
    const order = await this.orderService.updateOrderStatus(req.params.id, req.body as UpdateOrderStatusInput);

    res.status(200).json({
      success: true,
      data: order
    });
  };
}
