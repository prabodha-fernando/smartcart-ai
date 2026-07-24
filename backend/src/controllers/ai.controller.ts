import { asyncHandler } from "../utils/asyncHandler.js";
import { resolveAiChat, resolveWhyBuy } from "../services/ai.service.js";
import type { AiChatInput, WhyBuyInput } from "../validators/ai.validator.js";

export const handleAiChat = asyncHandler(async (req, res) => {
  const result = await resolveAiChat(req.body as AiChatInput);
  res.status(200).json(result);
});

export const handleWhyBuy = asyncHandler(async (req, res) => {
  const result = await resolveWhyBuy(req.body as WhyBuyInput);
  res.status(200).json({ text: result });
});
