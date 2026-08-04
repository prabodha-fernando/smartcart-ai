import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { errorHandler, encryptResponse, decryptRequest, requireAuth } from "@smartcart/shared";
import orderRoutes from "./routes/order.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import wishlistRoutes from "./routes/wishlist.routes.js";
import productRoutes from "./routes/product.routes.js";
import threadRoutes from "./routes/thread.routes.js";

export function createApp() {
  const app = express();
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cors());
  
  app.use(express.json());
  app.use(encryptResponse); // Encrypt all outgoing JSON responses
  app.use(decryptRequest);  // Decrypt incoming JSON requests
  app.use(morgan("dev"));
  app.use("/api/orders", requireAuth, orderRoutes);
  app.use("/api/cart", requireAuth, cartRoutes);
  app.use("/api/wishlist", requireAuth, wishlistRoutes);
  app.use("/api/products", productRoutes);
  app.use("/api/threads", threadRoutes);
  app.use(errorHandler);
  return app;
}
