import "dotenv/config";
import { z } from "zod";

/**
 * Central, validated access to environment variables.
 * The app refuses to start if required config is missing or malformed,
 * so we never hit a "silent misconfiguration" bug at runtime.
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),

  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),

  // JWT secrets — must differ so an access token can never be replayed as a refresh token.
  JWT_ACCESS_SECRET: z.string().min(16, "JWT_ACCESS_SECRET must be at least 16 chars"),
  JWT_REFRESH_SECRET: z.string().min(16, "JWT_REFRESH_SECRET must be at least 16 chars"),
  ACCESS_TOKEN_EXPIRES: z.string().default("15m"),
  REFRESH_TOKEN_EXPIRES: z.string().default("7d"),

  // Comma-separated list of allowed origins for CORS (the Next.js frontend).
  CORS_ORIGIN: z.string().default("http://localhost:3000"),

  // Upstream product source proxied through this backend.
  DUMMYJSON_BASE_URL: z.string().url().default("https://dummyjson.com"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment configuration:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export const corsOrigins = env.CORS_ORIGIN.split(",").map((o) => o.trim());
