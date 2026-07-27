import { createApp } from "./app.js";
import { connectDB, disconnectDB } from "./config/db.js";
import { env } from "./config/env.js";

function isNodeListenError(err: unknown): err is NodeJS.ErrnoException {
  return err instanceof Error && "code" in err;
}

async function start() {
  try {
    await connectDB();
  } catch (err) {
    console.error("❌ Failed to connect to MongoDB. Is it running?");
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    console.log(`🚀 SmartCart API running at http://localhost:${env.PORT}/api`);
    console.log(`   Environment: ${env.NODE_ENV}`);
  });

  server.on("error", async (err) => {
    if (isNodeListenError(err) && err.code === "EADDRINUSE") {
      console.error(`❌ Port ${env.PORT} is already in use.`);
      console.error("   Stop the existing server or set PORT to another value in backend/.env.");
    } else {
      console.error("❌ Failed to start HTTP server:");
      console.error(err);
    }

    await disconnectDB();
    process.exit(1);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received — shutting down gracefully...`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

void start();
