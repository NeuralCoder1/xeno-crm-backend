import { Router } from "express";
import { DashboardController } from "../controllers/dashboard.controller";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();
const dashboardController = new DashboardController();

router.get("/", asyncHandler(dashboardController.getSummary));

export default router;
