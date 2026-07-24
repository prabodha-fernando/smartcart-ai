import { Router } from "express";
import { aiRateLimit } from "../middleware/ai-rate-limit.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { aiChatSchema, whyBuySchema } from "../validators/ai.validator.js";
import { handleAiChat, handleWhyBuy } from "../controllers/ai.controller.js";

const router = Router();
router.use(aiRateLimit);

router.post("/chat", validate({ body: aiChatSchema }), handleAiChat);
router.post("/why-buy", validate({ body: whyBuySchema }), handleWhyBuy);

export default router;
