/**
 * Operational error with an HTTP status code. Throw this anywhere in a
 * controller/service and the central error handler turns it into a
 * consistent JSON response.
 */
export declare class ApiError extends Error {
    readonly statusCode: number;
    readonly details?: unknown;
    constructor(statusCode: number, message: string, details?: unknown);
    static badRequest(message?: string, details?: unknown): ApiError;
    static unauthorized(message?: string): ApiError;
    static forbidden(message?: string): ApiError;
    static notFound(message?: string): ApiError;
    static conflict(message?: string): ApiError;
}
