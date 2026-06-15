import type { Request, Response } from "express";
import { DashboardService } from "../services/dashboard.service";

export class DashboardController {
  constructor(private readonly dashboardService = new DashboardService()) {}

  getSummary = async (_req: Request, res: Response): Promise<void> => {
    const summary = await this.dashboardService.getSummary();

    res.status(200).json(summary);
  };
}
