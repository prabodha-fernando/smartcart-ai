import { Router } from "express";
import { aiRateLimit } from "@smartcart/shared";
import { validate } from "@smartcart/shared";
import { resolveAiChat, resolveWhyBuy } from "../services/ai.service.js";
import { asyncHandler, Chat } from "@smartcart/shared";
import { aiChatSchema, whyBuySchema, type AiChatInput, type WhyBuyInput } from "@smartcart/shared";

const router = Router();
router.use(aiRateLimit);

router.post("/chat", validate({ body: aiChatSchema }), asyncHandler(async (req, res) => {
  const input = req.body as AiChatInput;
  const userId = (req as any).userId as string;

  // Save the latest user message
  const userMessage = input.messages[input.messages.length - 1];
  await Chat.create({
    userId,
    senderId: userId,
    receiverId: "AI",
    role: "user",
    content: userMessage.content,
  });

  const aiResponse = await resolveAiChat(input);

  // Save the AI response
  await Chat.create({
    userId,
    senderId: "AI",
    receiverId: userId,
    role: "assistant",
    content: aiResponse.reply,
  });

  res.status(200).json(aiResponse);
}));

router.get("/chat/history", asyncHandler(async (req, res) => {
  const userId = (req as any).userId as string;
  // Fetch the 50 most recent messages, then reverse them so they display chronologically
  const latestChats = await Chat.find({ userId }).sort({ createdAt: -1 }).limit(50);
  const chats = latestChats.reverse();

  res.status(200).json({
    success: true,
    data: chats.map(c => ({
      id: c.id,
      role: c.role,
      content: c.content,
      createdAt: c.createdAt,
    }))
  });
}));

router.post("/why-buy", validate({ body: whyBuySchema }), asyncHandler(async (req, res) => {
  res.status(200).json({ text: await resolveWhyBuy(req.body as WhyBuyInput) });
}));

export default router;
