import type { NextFunction, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

export function requestId(req: Request, res: Response, next: NextFunction): void {
  // prefer existing request id from client headers when present
  const incoming = (req.header("x-request-id") || req.header("x-requestid") || req.header("x-correlation-id")) as string | undefined;
  const id = incoming && incoming.length > 0 ? incoming : uuidv4();
  req.requestId = id;
  // ensure header is present on response
  res.setHeader("x-request-id", id);
  next();
}
