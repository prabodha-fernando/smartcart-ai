import type { RequestHandler } from "express";
import { createHash } from "node:crypto";
import { env } from "../config/env.js";
import { AiRateLimit } from "../models/AiRateLimit.js";
import { ApiError } from "../utils/ApiError.js";
import { verifyAccessToken } from "../utils/token.js";

export const aiRateLimit: RequestHandler = async (req, _res, next) => {
  try {
    const userId = readOptionalUserId(req.headers.authorization);
    const identity = userId ? `user:${userId}` : `ip:${req.ip || "unknown"}`;
    const key = createHash("sha256").update(identity).digest("hex");
    const now = Date.now();
    const windowStart = new Date(Math.floor(now / 60_000) * 60_000);
    const record = await AiRateLimit.findOneAndUpdate(
      { key, windowStart },
      {
        $inc: { count: 1 },
        $setOnInsert: { expiresAt: new Date(now + 120_000) },
      },
      { upsert: true, new: true }
    );
    if (record.count > env.AI_RATE_LIMIT_PER_MINUTE) {
      return next(new ApiError(429, "AI request limit exceeded. Please try again shortly."));
    }
    if (userId) req.userId = userId;
    next();
  } catch (error) {
    next(error);
  }
};

function readOptionalUserId(header?: string) {
  if (!header?.startsWith("Bearer ")) return undefined;
  try {
    return verifyAccessToken(header.slice(7)).userId;
  } catch {
    return undefined;
  }
}
