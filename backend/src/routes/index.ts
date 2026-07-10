import { Router } from "express";
import healthRoutes from "./health.routes.js";
import authRoutes from "./auth.routes.js";

/**
 * Root API router for the authorization milestone.
 * Public routes: health and auth.
 */
const router = Router();

router.get("/", (_req, res) => {
  res.json({
    name: "SmartCart API",
    version: "1.0.0",
    status: "ok",
    endpoints: {
      health: "/api/health",
      auth: "/api/auth",
    },
  });
});

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);

export default router;
