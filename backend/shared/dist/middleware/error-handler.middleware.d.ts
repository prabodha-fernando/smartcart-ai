import type { ErrorRequestHandler, RequestHandler } from "express";
/** 404 handler for unmatched routes. Registered after all routes. */
export declare const notFound: RequestHandler;
/**
 * Central error handler. Produces the API's consistent error shape:
 *   { success: false, message, details? }
 */
export declare const errorHandler: ErrorRequestHandler;
