import express from "express";
import { connectDB } from "@smartcart/shared";
import { createApp as createAuthApp } from "../services/auth-service/src/app.js";
import { createApp as createOrderApp } from "../services/order-service/src/app.js";
import { createApp as createAiApp } from "../services/ai-service/src/app.js";

const app = express();

let isDbConnected = false;

app.use(async (_req, _res, next) => {
  if (!isDbConnected) {
    await connectDB();
    isDbConnected = true;
  }
  next();
});

app.get("/", (_req, res) => {
  res.status(200).json({ status: "ok", message: "SmartCart API is running natively on Vercel 🚀" });
});

app.use(createAuthApp());
app.use(createOrderApp());
app.use(createAiApp());

export default app;
