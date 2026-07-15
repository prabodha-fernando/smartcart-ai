import { Router } from "express";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
const windows = new Map<string, { count: number; resetAt: number }>();

router.post(
  "/completions",
  asyncHandler(async (req, res) => {
    if (!env.NVIDIA_NIM_API_KEY || !env.AI_PROXY_SECRET) {
      throw new ApiError(503, "AI service is not configured");
    }
    if (req.header("x-ai-proxy-secret") !== env.AI_PROXY_SECRET) {
      throw ApiError.unauthorized("Unauthorized AI proxy request");
    }

    const key = req.header("x-ai-client-id") || req.ip || "unknown";
    enforceRateLimit(key);

    const upstream = await fetch(`${env.NVIDIA_NIM_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.NVIDIA_NIM_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body),
    });

    if (!upstream.ok) {
      throw new ApiError(upstream.status, "AI provider request failed");
    }

    res.status(200).json(await upstream.json());
  })
);

function enforceRateLimit(key: string) {
  const now = Date.now();
  const current = windows.get(key);
  if (!current || current.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + 60_000 });
    return;
  }
  if (current.count >= env.AI_RATE_LIMIT_PER_MINUTE) {
    throw new ApiError(429, "AI request limit exceeded. Please try again shortly.");
  }
  current.count += 1;
}

export default router;
