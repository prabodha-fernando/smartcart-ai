import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { corsOrigins, env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import apiRouter from "./routes/index.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { asyncHandler } from "./utils/asyncHandler.js";

/**
 * Builds and configures the Express application (no side effects like
 * listening or DB connection — that lives in server.ts, which keeps the
 * app importable for tests).
 */
export function createApp() {
  const app = express();

  // Core middleware
  app.use(helmet());
  app.use(cors({ origin: corsOrigins, credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  if (env.NODE_ENV !== "test") {
    app.use(morgan(env.NODE_ENV === "development" ? "dev" : "combined"));
  }

  app.use(
    asyncHandler(async (_req, _res, next) => {
      await connectDB();
      next();
    })
  );

  // Routes (all API routes live under /api)
  app.use("/api", apiRouter);

  // 404 + centralized error handling (must be last)
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
