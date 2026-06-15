import { Router } from "express";
import { HealthController } from "../controllers/health.controller";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();
const healthController = new HealthController();

router.get("/", asyncHandler(healthController.getHealth));

export default router;
