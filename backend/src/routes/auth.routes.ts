import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();
const authController = new AuthController();

router.post("/demo-login", asyncHandler(authController.demoLogin));

export default router;
