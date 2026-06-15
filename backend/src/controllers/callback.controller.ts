import type { Request, Response } from "express";
import { CallbackService } from "../services/callback.service";
import type { ChannelEventInput } from "../types/callback";

export class CallbackController {
  constructor(private readonly callbackService = new CallbackService()) {}

  handleChannelEvent = async (req: Request, res: Response): Promise<void> => {
    const result = await this.callbackService.handleChannelEvent(req.body as ChannelEventInput);

    res.status(result.processed ? 200 : 409).json({
      success: result.processed,
      data: result
    });
  };
}
