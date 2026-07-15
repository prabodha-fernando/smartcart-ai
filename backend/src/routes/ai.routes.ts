import { Router } from "express";
import { aiRateLimit } from "../middleware/ai-rate-limit.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { resolveAiChat, resolveWhyBuy } from "../services/ai.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { aiChatSchema, whyBuySchema, type AiChatInput, type WhyBuyInput } from "../validators/ai.validator.js";

const router = Router();
router.use(aiRateLimit);

router.post("/chat", validate({ body: aiChatSchema }), asyncHandler(async (req, res) => {
  res.status(200).json(await resolveAiChat(req.body as AiChatInput));
}));

router.post("/why-buy", validate({ body: whyBuySchema }), asyncHandler(async (req, res) => {
  res.status(200).json({ text: await resolveWhyBuy(req.body as WhyBuyInput) });
}));

export default router;
