import type { RequestHandler } from "express";
import type { ZodTypeAny } from "zod";
/**
 * Builds middleware that validates and *replaces* parts of the request with
 * parsed, typed data. On failure the ZodError is forwarded to the central
 * error handler, which returns a 400 with field-level details.
 *
 * Usage: router.post("/", validate({ body: registerSchema }), handler)
 */
export declare const validate: (schemas: {
    body?: ZodTypeAny;
    query?: ZodTypeAny;
    params?: ZodTypeAny;
}) => RequestHandler;
