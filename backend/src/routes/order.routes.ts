import { Router } from "express";
import { createOrder, listOrders, getOrder } from "../controllers/order.controller.js";

// Mounted behind `requireAuth` in routes/index.ts.
const router = Router();

router.post("/", createOrder);
router.get("/", listOrders);
router.get("/:id", getOrder);

export default router;
