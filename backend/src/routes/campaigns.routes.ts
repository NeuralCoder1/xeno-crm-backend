import { Router } from "express";
import { CampaignController } from "../controllers/campaign.controller";
import { auth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../utils/asyncHandler";
import {
  campaignIdParamSchema,
  createCampaignSchema,
  listCampaignsQuerySchema,
  updateCampaignSchema
} from "../validators/campaign.validator";

const router = Router();
const campaignController = new CampaignController();

router.post("/", auth, validate({ body: createCampaignSchema }), asyncHandler(campaignController.createCampaign));
router.get("/", auth, validate({ query: listCampaignsQuerySchema }), asyncHandler(campaignController.getCampaigns));
router.get("/:id", auth, validate({ params: campaignIdParamSchema }), asyncHandler(campaignController.getCampaignById));
router.patch(
  "/:id",
  auth,
  validate({ params: campaignIdParamSchema, body: updateCampaignSchema }),
  asyncHandler(campaignController.updateCampaign)
);
router.post("/:id/launch", auth, validate({ params: campaignIdParamSchema }), asyncHandler(campaignController.launchCampaign));
router.get("/:id/analytics", auth, validate({ params: campaignIdParamSchema }), asyncHandler(campaignController.getCampaignAnalytics));

export default router;
