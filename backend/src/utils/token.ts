import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";

type TokenType = "access" | "refresh";
type TokenExpiry = SignOptions["expiresIn"];

export interface AuthTokenPayload {
  userId: string;
  type: TokenType;
  tokenVersion?: number;
}

function signToken(userId: string, type: TokenType, secret: Secret, expiresIn: TokenExpiry) {
  return jwt.sign({ userId, type }, secret, { expiresIn });
}

function verifyToken(token: string, secret: Secret, expectedType: TokenType): AuthTokenPayload {
  const decoded = jwt.verify(token, secret) as jwt.JwtPayload;

  if (decoded.type !== expectedType || typeof decoded.userId !== "string") {
    throw new Error("Invalid token payload");
  }

  return {
    userId: decoded.userId,
    type: expectedType,
  };
}

export function generateAccessToken(userId: string) {
  return signToken(userId, "access", env.JWT_ACCESS_SECRET, env.ACCESS_TOKEN_EXPIRES as TokenExpiry);
}

export function generateRefreshToken(userId: string, tokenVersion: number) {
  return jwt.sign(
    { userId, type: "refresh", tokenVersion },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.REFRESH_TOKEN_EXPIRES as TokenExpiry }
  );
}

export function verifyAccessToken(token: string) {
  return verifyToken(token, env.JWT_ACCESS_SECRET, "access");
}

export function verifyRefreshToken(token: string) {
  const payload = verifyToken(token, env.JWT_REFRESH_SECRET, "refresh");
  const decoded = jwt.decode(token) as jwt.JwtPayload;
  if (typeof decoded.tokenVersion !== "number") {
    throw new Error("Invalid refresh token version");
  }
  return { ...payload, tokenVersion: decoded.tokenVersion };
}
