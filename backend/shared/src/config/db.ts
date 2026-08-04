import mongoose from "mongoose";
import { env } from "./env.js";

let connectionPromise: Promise<typeof mongoose> | null = null;
let listenersRegistered = false;

/**
 * Connects to MongoDB. Called once on startup (see server.ts).
 * Throws on failure so the caller can decide whether to exit.
 */
export async function connectDB(): Promise<void> {
  mongoose.set("strictQuery", true);

  if (!listenersRegistered) {
    mongoose.connection.on("connected", () => {
      console.log("✅ MongoDB connected");
    });
    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err.message);
    });
    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️  MongoDB disconnected");
    });

    listenersRegistered = true;
  }

  if (mongoose.connection.readyState === 1) {
    return;
  }

  connectionPromise ??= mongoose.connect(env.MONGODB_URI);

  await connectionPromise;
}

/** Gracefully closes the connection (used on shutdown). */
export async function disconnectDB(): Promise<void> {
  connectionPromise = null;
  await mongoose.connection.close();
}
