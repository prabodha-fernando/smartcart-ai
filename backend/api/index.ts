import express from "express";
import { connectDB } from "@smartcart/shared";
import { createApp as createAuthApp } from "../services/auth-service/src/app.js";
import { createApp as createOrderApp } from "../services/order-service/src/app.js";
import { createApp as createAiApp } from "../services/ai-service/src/app.js";

const app = express();

let isDbConnected = false;

app.use(async (req, res, next) => {
  if (!isDbConnected) {
    await connectDB();
    isDbConnected = true;
  }
  next();
});

app.use(createAuthApp());
app.use(createOrderApp());
app.use(createAiApp());

export default app;
