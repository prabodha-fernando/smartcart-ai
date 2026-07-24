import { type Request, type Response, type NextFunction } from "express";
import CryptoJS from "crypto-js";
import { env } from "../config/env.js";

/**
 * Intercepts res.json() to encrypt the outgoing JSON payload.
 * The frontend must decrypt it before use.
 */
export function encryptPayload(_req: Request, res: Response, next: NextFunction) {
  const originalJson = res.json.bind(res);

  // Override res.json
  res.json = function (body: any) {
    try {
      // If the body is already the encrypted wrapper, just send it
      if (body && typeof body === "object" && body.encryptedPayload) {
        return originalJson(body);
      }

      // Stringify the original response body
      const jsonString = JSON.stringify(body);

      // Encrypt the JSON string using AES
      const ciphertext = CryptoJS.AES.encrypt(jsonString, env.ENCRYPTION_KEY).toString();

      // Send the encrypted payload
      return originalJson({ encryptedPayload: ciphertext });
    } catch (error) {
      console.error("Payload encryption failed:", error);
      // Fallback to sending standard error to not break completely, or just send empty
      return originalJson({ error: "Failed to encrypt payload" });
    }
  };

  next();
}
