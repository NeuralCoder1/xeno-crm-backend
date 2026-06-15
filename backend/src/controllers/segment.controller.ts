import type { Request, Response } from "express";
import { SegmentService } from "../services/segment.service";
import type { CreateSegmentInput, SegmentListQuery, UpdateSegmentInput } from "../types/segment";

export class SegmentController {
  constructor(private readonly segmentService = new SegmentService()) {}

  createSegment = async (req: Request, res: Response): Promise<void> => {
    const segment = await this.segmentService.createSegment(req.body as CreateSegmentInput);

    res.status(201).json({
      success: true,
      data: segment
    });
  };

  getSegments = async (req: Request, res: Response): Promise<void> => {
    const segments = await this.segmentService.getSegments(req.query as SegmentListQuery);

    res.status(200).json({
      success: true,
      data: segments
    });
  };

  getSegmentById = async (req: Request, res: Response): Promise<void> => {
    const segment = await this.segmentService.getSegmentById(req.params.id);

    res.status(200).json({
      success: true,
      data: segment
    });
  };

  updateSegment = async (req: Request, res: Response): Promise<void> => {
    const segment = await this.segmentService.updateSegment(req.params.id, req.body as UpdateSegmentInput);

    res.status(200).json({
      success: true,
      data: segment
    });
  };

  archiveSegment = async (req: Request, res: Response): Promise<void> => {
    const segment = await this.segmentService.archiveSegment(req.params.id);

    res.status(200).json({
      success: true,
      data: segment
    });
  };

  previewSegment = async (req: Request, res: Response): Promise<void> => {
    const preview = await this.segmentService.previewSegment(req.params.id);

    res.status(200).json({
      success: true,
      data: preview
    });
  };
}
