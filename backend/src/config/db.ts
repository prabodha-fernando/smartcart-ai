import mongoose from "mongoose";
import { env } from "./env.js";

/**
 * Connects to MongoDB. Called once on startup (see server.ts).
 * Throws on failure so the caller can decide whether to exit.
 */
export async function connectDB(): Promise<void> {
  mongoose.set("strictQuery", true);

  mongoose.connection.on("connected", () => {
    console.log("✅ MongoDB connected");
  });
  mongoose.connection.on("error", (err) => {
    console.error("❌ MongoDB connection error:", err.message);
  });
  mongoose.connection.on("disconnected", () => {
    console.warn("⚠️  MongoDB disconnected");
  });

  await mongoose.connect(env.MONGODB_URI);
}

/** Gracefully closes the connection (used on shutdown). */
export async function disconnectDB(): Promise<void> {
  await mongoose.connection.close();
}
