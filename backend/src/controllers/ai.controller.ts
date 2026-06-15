import type { Request, Response } from "express";
import { AIService } from "../services/ai.service";

export class AIController {
  constructor(private readonly aiService = new AIService()) {}

  generateSegment = async (req: Request, res: Response): Promise<void> => {
    const { prompt } = req.body as { prompt: string };
    const result = await this.aiService.generateSegment(prompt);

    res.status(200).json({ success: true, data: { rules: result.rules, session: result.session } });
  };

  generateMessage = async (req: Request, res: Response): Promise<void> => {
    const { campaignType, objective } = req.body as { campaignType: string; objective: string };
    const result = await this.aiService.generateMessage(campaignType, objective);

    res.status(200).json({ success: true, data: { message: result.message, session: result.session } });
  };

  recommendChannel = async (req: Request, res: Response): Promise<void> => {
    const { campaignType, audienceSize } = req.body as { campaignType: string; audienceSize: number };
    const result = await this.aiService.recommendChannel(campaignType, audienceSize);

    res.status(200).json({ success: true, data: { channel: result.channel, reason: result.reason, session: result.session } });
  };

  copilot = async (req: Request, res: Response): Promise<void> => {
    const { prompt } = req.body as { prompt: string };
    const result = await this.aiService.copilot(prompt);

    res.status(200).json({ success: true, data: result });
  };
}

export default AIController;
