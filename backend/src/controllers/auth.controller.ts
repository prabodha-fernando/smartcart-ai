import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import {
  getCurrentUser,
  loginUser,
  refreshUserToken,
  registerUser,
} from "../services/auth.service.js";
import type {
  LoginInput,
  RefreshInput,
  RegisterInput,
} from "../validators/auth.validator.js";

export const register = asyncHandler(async (req, res) => {
  const authData = await registerUser(req.body as RegisterInput);

  res.status(201).json({
    success: true,
    message: "Registration successful",
    data: authData,
  });
});

export const login = asyncHandler(async (req, res) => {
  const authData = await loginUser(req.body as LoginInput);

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: authData,
  });
});

export const me = asyncHandler(async (req, res) => {
  if (!req.userId) {
    throw AppError.unauthorized("Unauthorized");
  }

  const user = await getCurrentUser(req.userId);

  res.status(200).json({
    success: true,
    message: "Current user fetched successfully",
    data: {
      user,
    },
  });
});

export const refresh = asyncHandler(async (req, res) => {
  const tokenData = await refreshUserToken(req.body as RefreshInput);

  res.status(200).json({
    success: true,
    message: "Access token refreshed successfully",
    data: tokenData,
  });
});
