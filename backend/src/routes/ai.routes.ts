import { Router } from "express";
import { AIController } from "../controllers/ai.controller";
import { validate } from "../middleware/validate";
import { generateSegmentSchema, generateMessageSchema, recommendChannelSchema, copilotSchema } from "../validators/ai.validator";

const router = Router();
const controller = new AIController();

router.post("/generate-segment", validate({ body: generateSegmentSchema }), controller.generateSegment);
router.post("/generate-message", validate({ body: generateMessageSchema }), controller.generateMessage);
router.post("/recommend-channel", validate({ body: recommendChannelSchema }), controller.recommendChannel);
router.post("/copilot", validate({ body: copilotSchema }), controller.copilot);

export default router;
