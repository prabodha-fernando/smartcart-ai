import type { RequestHandler } from "express";
import type { ZodTypeAny } from "zod";

/**
 * Builds middleware that validates and *replaces* parts of the request with
 * parsed, typed data. On failure the ZodError is forwarded to the central
 * error handler, which returns a 400 with field-level details.
 *
 * Usage: router.post("/", validate({ body: registerSchema }), handler)
 */
export const validate =
  (schemas: { body?: ZodTypeAny; query?: ZodTypeAny; params?: ZodTypeAny }): RequestHandler =>
  (req, _res, next) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.query) req.query = schemas.query.parse(req.query) as typeof req.query;
      if (schemas.params) req.params = schemas.params.parse(req.params) as typeof req.params;
      next();
    } catch (err) {
      next(err);
    }
  };
