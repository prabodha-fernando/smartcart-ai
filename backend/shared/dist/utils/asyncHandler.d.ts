import type { NextFunction, Request, RequestHandler, Response } from "express";
/**
 * Wraps an async route handler so any rejected promise is forwarded to
 * Express's error middleware instead of crashing the process. Lets
 * controllers use plain `async/await` + `throw` without try/catch everywhere.
 */
export declare const asyncHandler: (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) => RequestHandler;
