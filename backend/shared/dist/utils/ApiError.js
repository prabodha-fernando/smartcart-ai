/**
 * Operational error with an HTTP status code. Throw this anywhere in a
 * controller/service and the central error handler turns it into a
 * consistent JSON response.
 */
export class ApiError extends Error {
    statusCode;
    details;
    constructor(statusCode, message, details) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        this.name = "ApiError";
        Error.captureStackTrace?.(this, ApiError);
    }
    static badRequest(message = "Bad request", details) {
        return new ApiError(400, message, details);
    }
    static unauthorized(message = "Unauthorized") {
        return new ApiError(401, message);
    }
    static forbidden(message = "Forbidden") {
        return new ApiError(403, message);
    }
    static notFound(message = "Not found") {
        return new ApiError(404, message);
    }
    static conflict(message = "Conflict") {
        return new ApiError(409, message);
    }
}
