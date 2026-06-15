import type { Request, Response } from "express";
import { HealthService } from "../services/health.service";

export class HealthController {
  constructor(private readonly healthService = new HealthService()) {}

  getHealth = async (_req: Request, res: Response): Promise<void> => {
    const health = await this.healthService.getHealth();

    res.status(200).json(health);
  };
}
