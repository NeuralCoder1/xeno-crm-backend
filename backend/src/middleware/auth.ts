import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { env } from "../config/env";
import { AppError } from "../utils/appError";
import type { AuthUser } from "../types/auth";

interface AccessTokenPayload extends JwtPayload {
  sub: string;
  email?: string;
  role?: string;
}

function isAccessTokenPayload(payload: string | JwtPayload): payload is AccessTokenPayload {
  return typeof payload !== "string" && typeof payload.sub === "string" && payload.sub.length > 0;
}

export function auth(req: Request, _res: Response, next: NextFunction): void {
  const authorization = req.header("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return next(new AppError("Authentication token is required.", 401, "UNAUTHORIZED"));
  }

  const token = authorization.slice("Bearer ".length).trim();

  if (!token) {
    return next(new AppError("Authentication token is required.", 401, "UNAUTHORIZED"));
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);

    if (!isAccessTokenPayload(decoded)) {
      return next(new AppError("Invalid authentication token.", 401, "UNAUTHORIZED"));
    }

    const user: AuthUser = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role
    };

    req.user = user;
    return next();
  } catch (error) {
    return next(new AppError("Invalid authentication token.", 401, "UNAUTHORIZED"));
  }
}
