import { SegmentStatus, type Prisma, type Segment } from "@prisma/client";
import { prisma } from "../config/db";
import type { SegmentListQuery } from "../types/segment";

export class SegmentRepository {
  create(data: Prisma.SegmentCreateInput): Promise<Segment> {
    return prisma.segment.create({ data });
  }

  findAll(query: SegmentListQuery = {}): Promise<Segment[]> {
    return prisma.segment.findMany({
      where: {
        status: query.status
      },
      orderBy: {
        updatedAt: "desc"
      }
    });
  }

  findById(id: string): Promise<Segment | null> {
    return prisma.segment.findUnique({
      where: { id }
    });
  }

  update(id: string, data: Prisma.SegmentUpdateInput): Promise<Segment> {
    return prisma.segment.update({
      where: { id },
      data
    });
  }

  archive(id: string): Promise<Segment> {
    return prisma.segment.update({
      where: { id },
      data: {
        status: SegmentStatus.archived
      }
    });
  }
}
