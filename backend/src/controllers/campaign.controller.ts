import type { Request, Response } from "express";
import { CampaignService } from "../services/campaign.service";
import type { CampaignListQuery, CreateCampaignInput, UpdateCampaignInput } from "../types/campaign";

export class CampaignController {
  constructor(private readonly campaignService = new CampaignService()) {}

  createCampaign = async (req: Request, res: Response): Promise<void> => {
    const campaign = await this.campaignService.createCampaign(req.body as CreateCampaignInput);

    res.status(201).json({
      success: true,
      data: campaign
    });
  };

  getCampaigns = async (req: Request, res: Response): Promise<void> => {
    const query = req.query as any;
    const page = query.page ? Number(query.page) : undefined;
    const limit = query.limit ? Number(query.limit) : undefined;

    if (page !== undefined || limit !== undefined) {
      const p = Math.max(page ?? 1, 1);
      const l = Math.min(limit ?? 20, 100);
      const { items, total } = await this.campaignService['campaignRepository'].findAllPaginated(query as any, p, l);
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

    const campaigns = await this.campaignService.getCampaigns(req.query as CampaignListQuery);

    res.status(200).json({ success: true, data: campaigns });
  };

  getCampaignById = async (req: Request, res: Response): Promise<void> => {
    const campaign = await this.campaignService.getCampaignById(req.params.id);

    res.status(200).json({
      success: true,
      data: campaign
    });
  };

  updateCampaign = async (req: Request, res: Response): Promise<void> => {
    const campaign = await this.campaignService.updateCampaign(req.params.id, req.body as UpdateCampaignInput);

    res.status(200).json({
      success: true,
      data: campaign
    });
  };

  launchCampaign = async (req: Request, res: Response): Promise<void> => {
    const result = await this.campaignService.launchCampaign(req.params.id);

    res.status(202).json({
      success: true,
      data: result
    });
  };

  getCampaignAnalytics = async (req: Request, res: Response): Promise<void> => {
    const analytics = await this.campaignService.getCampaignAnalytics(req.params.id);

    res.status(200).json({
      success: true,
      data: analytics
    });
  };
}
