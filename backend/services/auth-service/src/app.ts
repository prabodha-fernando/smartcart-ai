import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { errorHandler, encryptResponse, decryptRequest } from "@smartcart/shared";
import authRoutes from "./routes/auth.routes.js";
import threadRoutes from "./routes/thread.routes.js";

export function createApp() {
  const app = express();
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cors());
  
  app.use(express.json());
  app.use(encryptResponse); // Encrypt all outgoing JSON responses
  app.use(decryptRequest);  // Decrypt incoming JSON requests
  app.use(morgan("dev"));
  app.use("/api/auth", authRoutes);
  app.use("/api/threads", threadRoutes);
  app.use(errorHandler);
  return app;
}
