import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import healthRoutes from "./health.routes.js";
import authRoutes from "./auth.routes.js";
import productRoutes from "./product.routes.js";
import cartRoutes from "./cart.routes.js";

/**
 * Root API router. Public routes: health, auth, products (catalog proxy).
 * Cart is user-owned and protected with JWT auth.
 */
const router = Router();

/** API index - a simple welcome/discovery response at the root of /api. */
router.get("/", (_req, res) => {
  res.json({
    name: "SmartCart API",
    version: "1.0.0",
    status: "ok",
    endpoints: {
      health: "/api/health",
      auth: "/api/auth",
      products: "/api/products",
      cart: "/api/cart",
    },
  });
});

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/products", productRoutes);
router.use("/cart", requireAuth, cartRoutes);

export default router;
