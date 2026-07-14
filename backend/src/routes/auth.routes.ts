import { Router } from "express";
import { validate } from "../middleware/validate.middleware.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { registerSchema, loginSchema, refreshSchema } from "../validators/auth.validator.js";
import { register, login, refresh, me } from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", validate({ body: registerSchema }), register);
router.post("/login", validate({ body: loginSchema }), login);
router.post("/refresh", validate({ body: refreshSchema }), refresh);
router.get("/me", requireAuth, me);

export default router;
