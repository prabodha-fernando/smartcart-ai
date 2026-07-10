import "express";

/**
 * Augment Express's Request so protected routes can read the authenticated
 * user's id, populated by the `requireAuth` middleware.
 */
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}
