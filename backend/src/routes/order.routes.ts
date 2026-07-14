import { Router } from "express";
import { createOrder, listOrders, getOrder } from "../controllers/order.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  listOrdersQuerySchema,
  orderIdParamSchema,
} from "../validators/order.validator.js";

// Mounted behind `requireAuth` in routes/index.ts.
const router = Router();

router.post("/", createOrder);
router.get("/", validate({ query: listOrdersQuerySchema }), listOrders);
router.get("/:id", validate({ params: orderIdParamSchema }), getOrder);

export default router;
