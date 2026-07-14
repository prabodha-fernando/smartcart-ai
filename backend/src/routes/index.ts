import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import healthRoutes from "./health.routes.js";
import authRoutes from "./auth.routes.js";
import productRoutes from "./product.routes.js";
import cartRoutes from "./cart.routes.js";
import wishlistRoutes from "./wishlist.routes.js";
import orderRoutes from "./order.routes.js";

/**
 * Root API router. Public routes: health, auth, products (catalog proxy).
 * Everything user-owned (cart, wishlist, orders) sits behind `requireAuth`.
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
      wishlist: "/api/wishlist",
      orders: "/api/orders",
    },
  });
});

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/products", productRoutes);

router.use("/cart", requireAuth, cartRoutes);
router.use("/wishlist", requireAuth, wishlistRoutes);
router.use("/orders", requireAuth, orderRoutes);

export default router;
