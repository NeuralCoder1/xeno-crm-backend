import { Router } from "express";
import { CallbackController } from "../controllers/callback.controller";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { channelEventSchema } from "../validators/callback.validator";

const router = Router();
const callbackController = new CallbackController();

router.post("/channel-events", validate({ body: channelEventSchema }), asyncHandler(callbackController.handleChannelEvent));

export default router;
