import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User, type UserDocument } from "../models/User.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/token.js";
import type {
  LoginInput,
  RefreshInput,
  RegisterInput,
} from "../validators/auth.validator.js";

function serializeUser(user: UserDocument) {
  const fallbackName = user.email.split("@")[0] ?? "SmartCart User";

  return {
    id: user.id as string,
    name: user.name || fallbackName,
    email: user.email,
  };
}

function createAuthData(user: UserDocument) {
  const userId = user.id as string;

  return {
    user: serializeUser(user),
    accessToken: generateAccessToken(userId),
    refreshToken: generateRefreshToken(userId, user.tokenVersion),
  };
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body as RegisterInput;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw ApiError.conflict("Email is already registered");
  }

  const user = await User.create({ name, email, password });

  res.status(201).json({
    success: true,
    message: "Registration successful",
    data: createAuthData(user),
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body as LoginInput;

  const user = await User.findOne({ email }).select("+password +tokenVersion");
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: createAuthData(user),
  });
});

export const me = asyncHandler(async (req, res) => {
  if (!req.userId) {
    throw ApiError.unauthorized("Unauthorized");
  }

  const user = await User.findById(req.userId);
  if (!user) {
    throw ApiError.notFound("User not found");
  }

  res.status(200).json({
    success: true,
    message: "Current user fetched successfully",
    data: {
      user: serializeUser(user),
    },
  });
});

export const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body as RefreshInput;

  let payload: { userId: string; tokenVersion: number };
  try {
    payload = verifyRefreshToken(refreshToken) as typeof payload;
  } catch {
    throw ApiError.unauthorized("Invalid or expired refresh token");
  }

  const user = await User.findOneAndUpdate(
    { _id: payload.userId, tokenVersion: payload.tokenVersion },
    { $inc: { tokenVersion: 1 } },
    { new: true }
  ).select("+tokenVersion");
  if (!user) {
    throw ApiError.unauthorized("Invalid, expired, or already used refresh token");
  }

  res.status(200).json({
    success: true,
    message: "Access token refreshed successfully",
    data: {
      accessToken: generateAccessToken(user.id as string),
      refreshToken: generateRefreshToken(user.id as string, user.tokenVersion),
    },
  });
});
