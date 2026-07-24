/**
 * Operational error with an HTTP status code. Throw this anywhere in a
 * controller/service and the central error handler turns it into a
 * consistent JSON response.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = "AppError";
    Error.captureStackTrace?.(this, AppError);
  }

  static badRequest(message = "Bad request", details?: unknown) {
    return new AppError(400, message, details);
  }
  static unauthorized(message = "Unauthorized") {
    return new AppError(401, message);
  }
  static forbidden(message = "Forbidden") {
    return new AppError(403, message);
  }
  static notFound(message = "Not found") {
    return new AppError(404, message);
  }
  static conflict(message = "Conflict") {
    return new AppError(409, message);
  }
}
