import type { Request, Response } from "express";
import { CommunicationLogService } from "../services/communicationLog.service";
import type { CommunicationLogListQuery } from "../types/communicationLog";

export class CommunicationLogController {
  constructor(private readonly communicationLogService = new CommunicationLogService()) {}

  getCommunicationLogs = async (req: Request, res: Response): Promise<void> => {
    const query = req.query as any;
    const page = query.page ? Number(query.page) : undefined;
    const limit = query.limit ? Number(query.limit) : undefined;

    if (page !== undefined || limit !== undefined) {
      const p = Math.max(page ?? 1, 1);
      const l = Math.min(limit ?? 20, 100);
      const { items, total } = await this.communicationLogService['communicationLogRepository'].findAllPaginated(query as any, p, l);
      const pages = Math.max(1, Math.ceil(total / l));

      res.status(200).json({
        success: true,
        data: {
          items,
          pagination: { page: p, limit: l, total, pages }
        }
      });
      return;
    }

    const communicationLogs = await this.communicationLogService.getCommunicationLogs(req.query as CommunicationLogListQuery);

    res.status(200).json({ success: true, data: communicationLogs });
  };

  getCommunicationLogById = async (req: Request, res: Response): Promise<void> => {
    const communicationLog = await this.communicationLogService.getCommunicationLogById(req.params.id);

    res.status(200).json({
      success: true,
      data: communicationLog
    });
  };

  retryCommunication = async (req: Request, res: Response): Promise<void> => {
    const result = await this.communicationLogService.retryCommunication(req.params.id);

    res.status(202).json({
      success: true,
      data: result
    });
  };
}
