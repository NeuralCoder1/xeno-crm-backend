import { Router } from "express";
import { CommunicationLogController } from "../controllers/communicationLog.controller";
import { auth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { communicationLogIdParamSchema, listCommunicationLogsQuerySchema } from "../validators/communicationLog.validator";

const router = Router();
const communicationLogController = new CommunicationLogController();

router.get("/", auth, validate({ query: listCommunicationLogsQuerySchema }), asyncHandler(communicationLogController.getCommunicationLogs));
router.post(
  "/:id/retry",
  auth,
  validate({ params: communicationLogIdParamSchema }),
  asyncHandler(communicationLogController.retryCommunication)
);
router.get(
  "/:id",
  auth,
  validate({ params: communicationLogIdParamSchema }),
  asyncHandler(communicationLogController.getCommunicationLogById)
);

export default router;
