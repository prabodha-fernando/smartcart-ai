import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
function signToken(userId, type, secret, expiresIn) {
    return jwt.sign({ userId, type }, secret, { expiresIn });
}
function verifyToken(token, secret, expectedType) {
    const decoded = jwt.verify(token, secret);
    if (decoded.type !== expectedType || typeof decoded.userId !== "string") {
        throw new Error("Invalid token payload");
    }
    return {
        userId: decoded.userId,
        type: expectedType,
    };
}
export function generateAccessToken(userId) {
    return signToken(userId, "access", env.JWT_ACCESS_SECRET, env.ACCESS_TOKEN_EXPIRES);
}
export function generateRefreshToken(userId, tokenVersion) {
    return jwt.sign({ userId, type: "refresh", tokenVersion }, env.JWT_REFRESH_SECRET, { expiresIn: env.REFRESH_TOKEN_EXPIRES });
}
export function verifyAccessToken(token) {
    return verifyToken(token, env.JWT_ACCESS_SECRET, "access");
}
export function verifyRefreshToken(token) {
    const payload = verifyToken(token, env.JWT_REFRESH_SECRET, "refresh");
    const decoded = jwt.decode(token);
    if (typeof decoded.tokenVersion !== "number") {
        throw new Error("Invalid refresh token version");
    }
    return { ...payload, tokenVersion: decoded.tokenVersion };
}
