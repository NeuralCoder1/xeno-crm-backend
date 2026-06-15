import { SegmentStatus, type Prisma, type Segment } from "@prisma/client";
import { CustomerRepository } from "../repositories/customer.repository";
import { SegmentRepository } from "../repositories/segment.repository";
import type { AudiencePreview, CreateSegmentInput, SegmentListQuery, UpdateSegmentInput } from "../types/segment";
import { AppError } from "../utils/appError";
import { AudienceRuleService } from "./audienceRule.service";

export class SegmentService {
  constructor(
    private readonly segmentRepository = new SegmentRepository(),
    private readonly customerRepository = new CustomerRepository(),
    private readonly audienceRuleService = new AudienceRuleService()
  ) {}

  async createSegment(input: CreateSegmentInput): Promise<Segment> {
    const estimatedAudienceSize = await this.estimateRules(input.rules);

    return this.segmentRepository.create({
      name: input.name,
      description: input.description,
      status: input.status ?? SegmentStatus.draft,
      rules: input.rules as unknown as Prisma.InputJsonValue,
      estimatedAudienceSize,
      lastEvaluatedAt: new Date()
    });
  }

  getSegments(query: SegmentListQuery = {}): Promise<Segment[]> {
    return this.segmentRepository.findAll(query);
  }

  async getSegmentById(id: string): Promise<Segment> {
    const segment = await this.segmentRepository.findById(id);

    if (!segment) {
      throw new AppError("Segment not found.", 404, "SEGMENT_NOT_FOUND");
    }

    return segment;
  }

  async updateSegment(id: string, input: UpdateSegmentInput): Promise<Segment> {
    const existing = await this.getSegmentById(id);
    const data: Prisma.SegmentUpdateInput = {};

    if (input.name !== undefined) data.name = input.name;
    if (input.description !== undefined) data.description = input.description;
    if (input.status !== undefined) data.status = input.status;

    if (input.rules !== undefined) {
      const estimatedAudienceSize = await this.estimateRules(input.rules);
      data.rules = input.rules as unknown as Prisma.InputJsonValue;
      data.estimatedAudienceSize = estimatedAudienceSize;
      data.lastEvaluatedAt = new Date();
      data.version = existing.version + 1;
    }

    return this.segmentRepository.update(id, data);
  }

  async archiveSegment(id: string): Promise<Segment> {
    const segment = await this.getSegmentById(id);

    if (segment.status === SegmentStatus.archived) {
      return segment;
    }

    return this.segmentRepository.archive(id);
  }

  async previewSegment(id: string): Promise<AudiencePreview> {
    const segment = await this.getSegmentById(id);
    const evaluatedAt = new Date();
    const rules = segment.rules as unknown as CreateSegmentInput["rules"];
    const estimatedAudienceSize = await this.estimateRules(rules);

    await this.segmentRepository.update(id, {
      estimatedAudienceSize,
      lastEvaluatedAt: evaluatedAt
    });

    return {
      segmentId: segment.id,
      estimatedAudienceSize,
      evaluatedAt
    };
  }

  private estimateRules(rules: CreateSegmentInput["rules"]): Promise<number> {
    const where = this.audienceRuleService.buildCustomerWhere(rules);

    return this.customerRepository.countByWhere(where);
  }
}
