/**
 * Connects to MongoDB. Called once on startup (see server.ts).
 * Throws on failure so the caller can decide whether to exit.
 */
export declare function connectDB(): Promise<void>;
/** Gracefully closes the connection (used on shutdown). */
export declare function disconnectDB(): Promise<void>;
