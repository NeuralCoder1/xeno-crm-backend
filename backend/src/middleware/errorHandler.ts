import type { ErrorRequestHandler } from "express";
import { AppError } from "../utils/appError";

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    stack?: string;
  };
}

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const appError =
    error instanceof AppError
      ? error
      : new AppError("An unexpected error occurred.", 500, "INTERNAL_SERVER_ERROR");

  if (appError.statusCode >= 500) {
    console.error(error);
  }

  const response: ErrorResponse = {
    success: false,
    error: {
      code: appError.code,
      message: appError.message
    }
  };

  const isProduction = process.env.NODE_ENV === "production";

  if (!isProduction && appError.details !== undefined) {
    response.error.details = appError.details;
  }

  if (!isProduction && error instanceof Error && error.stack) {
    response.error.stack = error.stack;
  }

  res.status(appError.statusCode).json(response);
};
