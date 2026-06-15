import { Router } from "express";
import { SegmentController } from "../controllers/segment.controller";
import { auth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../utils/asyncHandler";
import {
  createSegmentSchema,
  listSegmentsQuerySchema,
  segmentIdParamSchema,
  updateSegmentSchema
} from "../validators/segment.validator";

const router = Router();
const segmentController = new SegmentController();

router.get("/", auth, validate({ query: listSegmentsQuerySchema }), asyncHandler(segmentController.getSegments));
router.get("/:id", auth, validate({ params: segmentIdParamSchema }), asyncHandler(segmentController.getSegmentById));
router.post("/", auth, validate({ body: createSegmentSchema }), asyncHandler(segmentController.createSegment));
router.patch(
  "/:id",
  auth,
  validate({ params: segmentIdParamSchema, body: updateSegmentSchema }),
  asyncHandler(segmentController.updateSegment)
);
router.delete("/:id", auth, validate({ params: segmentIdParamSchema }), asyncHandler(segmentController.archiveSegment));
router.post("/:id/preview", auth, validate({ params: segmentIdParamSchema }), asyncHandler(segmentController.previewSegment));

export default router;
