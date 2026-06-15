import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";
import { AppError } from "../utils/appError";

interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const errors: unknown[] = [];

    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (result.success) {
        req.body = result.data;
      } else {
        errors.push(...result.error.issues);
      }
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (result.success) {
        req.query = result.data;
      } else {
        errors.push(...result.error.issues);
      }
    }

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (result.success) {
        req.params = result.data;
      } else {
        errors.push(...result.error.issues);
      }
    }

    if (errors.length > 0) {
      return next(new AppError("Request validation failed.", 400, "VALIDATION_ERROR", errors));
    }

    return next();
  };
}
