import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import { corsOrigins } from "../config/env.js";
import { verifyAccessToken } from "../utils/token.js";
import { aiChatSchema } from "../validators/ai.validator.js";
import { resolveAiChatStream } from "../services/ai.service.js";
import { checkAiRateLimit } from "../middleware/ai-rate-limit.middleware.js";

export function initSocket(server: HttpServer) {
  const io = new Server(server, {
    cors: {
      origin: corsOrigins,
      credentials: true,
    },
  });

  // Connection Authentication
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(" ")[1];
    
    if (!token) {
      return next(new Error("Authentication error: Token missing"));
    }

    try {
      const payload = verifyAccessToken(token);
      socket.data.userId = payload.userId;
      next();
    } catch (err) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Socket connected: ${socket.id} (User: ${socket.data.userId})`);

    // Streaming Handler
    socket.on("ai:message", async (data, callback) => {
      try {
        const allowed = await checkAiRateLimit(socket.data.userId, socket.handshake.address);
        if (!allowed) {
          socket.emit("ai:error", { message: "AI request limit exceeded. Please try again shortly." });
          if (typeof callback === "function") callback({ error: "Rate limit exceeded" });
          return;
        }

        const input = aiChatSchema.parse(data);
        
        await resolveAiChatStream(
          input,
          (metadata) => {
            socket.emit("ai:start", metadata);
          },
          (chunk) => {
            socket.emit("ai:chunk", chunk);
          },
          () => {
            socket.emit("ai:done");
          }
        );
        
        if (typeof callback === "function") {
          callback({ success: true });
        }
      } catch (error) {
        console.error("AI WebSocket error:", error);
        socket.emit("ai:error", { message: error instanceof Error ? error.message : "Internal server error" });
        if (typeof callback === "function") {
          callback({ error: "Failed to process message" });
        }
      }
    });

    socket.on("disconnect", () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}
