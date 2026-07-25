import express from "express";
import {
  forgetPassword,
  login,
  logout,
  register,
  resendVerificationCode,
  updatePassword,
  verifyEmail,
  checkAuth,
  refreshAccessToken,
} from "../controllers/user/auth.controllers";

import { authMiddleware } from "../middlewares/auth.middleware";
import { authLimiter, strictLimiter, mediumLimiter } from "../middlewares/rateLimiter";
import { validate } from "../middlewares/validate.middleware";
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  updatePasswordSchema,
} from "../schemas/auth.schema";

const router = express.Router();

router.post("/register", authLimiter, validate(registerSchema), register);
router.post("/verifyEmail", mediumLimiter, validate(verifyEmailSchema), verifyEmail);

router.post("/login", authLimiter, validate(loginSchema), login);

router.post("/resendverificationcode", strictLimiter, resendVerificationCode);
router.post("/forgotPassword", strictLimiter, validate(forgotPasswordSchema), forgetPassword);

router.post("/updatepassword", mediumLimiter, validate(updatePasswordSchema), updatePassword);
router.post("/refresh", mediumLimiter, refreshAccessToken);

router.post("/logout", authMiddleware, logout);
router.get("/check", authMiddleware, checkAuth);

export default router;