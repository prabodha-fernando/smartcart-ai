import type { RequestHandler } from "express";
import { AppError } from "../utils/AppError.js";
import { verifyAccessToken } from "../utils/token.js";

export const requireAuth: RequestHandler = (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return next(AppError.unauthorized("Missing or malformed Authorization header"));
  }

  try {
    const token = authHeader.slice("Bearer ".length);
    const payload = verifyAccessToken(token);
    req.userId = payload.userId;
    next();
  } catch {
    next(AppError.unauthorized("Invalid or expired access token"));
  }
};
