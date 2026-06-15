import type { Request, Response } from "express";
import { CustomerService } from "../services/customer.service";
import type { CreateCustomerInput, CustomerListQuery, UpdateCustomerInput } from "../types/customer";

export class CustomerController {
  constructor(private readonly customerService = new CustomerService()) {}

  createCustomer = async (req: Request, res: Response): Promise<void> => {
    const customer = await this.customerService.createCustomer(req.body as CreateCustomerInput);

    res.status(201).json({
      success: true,
      data: customer
    });
  };

  getCustomers = async (req: Request, res: Response): Promise<void> => {
    const query = req.query as any;
    const page = query.page ? Number(query.page) : undefined;
    const limit = query.limit ? Number(query.limit) : undefined;

    if (page !== undefined || limit !== undefined) {
      const p = Math.max(page ?? 1, 1);
      const l = Math.min(limit ?? 20, 100);
      const { items, total } = await this.customerService['customerRepository'].findAllPaginated(query as any, p, l);
      const pages = Math.max(1, Math.ceil(total / l));

      res.status(200).json({
        success: true,
        data: {
          items,
          pagination: { page: p, limit: l, total, pages }
        }
      });
      return;
    }

    const customers = await this.customerService.getCustomers(req.query as CustomerListQuery);

    res.status(200).json({ success: true, data: customers });
  };

  getCustomerById = async (req: Request, res: Response): Promise<void> => {
    const customer = await this.customerService.getCustomerById(req.params.id);

    res.status(200).json({
      success: true,
      data: customer
    });
  };

  updateCustomer = async (req: Request, res: Response): Promise<void> => {
    const customer = await this.customerService.updateCustomer(req.params.id, req.body as UpdateCustomerInput);

    res.status(200).json({
      success: true,
      data: customer
    });
  };

  deleteCustomer = async (req: Request, res: Response): Promise<void> => {
    const customer = await this.customerService.deleteCustomer(req.params.id);

    res.status(200).json({
      success: true,
      data: customer
    });
  };
}
