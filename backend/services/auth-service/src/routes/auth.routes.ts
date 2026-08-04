import { Router } from "express";
import { validate } from "@smartcart/shared";
import { requireAuth } from "@smartcart/shared";
import { registerSchema, loginSchema, refreshSchema } from "@smartcart/shared";
import { register, login, refresh, me } from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", validate({ body: registerSchema }), register);
router.post("/login", validate({ body: loginSchema }), login);
router.post("/refresh", validate({ body: refreshSchema }), refresh);
router.get("/me", requireAuth, me);

export default router;
