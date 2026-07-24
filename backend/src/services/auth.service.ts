import { AppError } from "../utils/AppError.js";
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
import { UserRepository } from "../repositories/user.repository.js";
import type { UserDocument } from "../models/User.js";

export interface SerializedUser {
  id: string;
  name: string;
  email: string;
}

function serializeUser(user: UserDocument): SerializedUser {
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

export async function registerUser(input: RegisterInput) {
  const existingUser = await UserRepository.findByEmail(input.email);
  if (existingUser) {
    throw AppError.conflict("Email is already registered");
  }

  const user = await UserRepository.create(input);
  return createAuthData(user);
}

export async function loginUser(input: LoginInput) {
  const user = await UserRepository.findByEmail(input.email);
  if (!user || !(await user.comparePassword(input.password))) {
    throw AppError.unauthorized("Invalid email or password");
  }

  return createAuthData(user);
}

export async function getCurrentUser(userId: string) {
  const user = await UserRepository.findById(userId);
  if (!user) {
    throw AppError.notFound("User not found");
  }

  return serializeUser(user);
}

export async function refreshUserToken(input: RefreshInput) {
  let payload: { userId: string; tokenVersion: number };
  try {
    payload = verifyRefreshToken(input.refreshToken) as typeof payload;
  } catch {
    throw AppError.unauthorized("Invalid or expired refresh token");
  }

  const user = await UserRepository.incrementTokenVersion(
    payload.userId,
    payload.tokenVersion
  );
  if (!user) {
    throw AppError.unauthorized("Invalid, expired, or already used refresh token");
  }

  return {
    accessToken: generateAccessToken(user.id as string),
    refreshToken: generateRefreshToken(user.id as string, user.tokenVersion),
  };
}
