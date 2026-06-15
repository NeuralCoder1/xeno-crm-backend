import type { Request, Response } from "express";
import { AuthService } from "../services/auth.service";

export class AuthController {
  constructor(private readonly authService = new AuthService()) {}

  demoLogin = async (_req: Request, res: Response): Promise<void> => {
    const token = this.authService.createDemoToken();

    res.status(200).json({
      success: true,
      data: {
        token
      }
    });
  };
}
