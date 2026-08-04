import { Request, Response, NextFunction } from 'express';
import { decryptPayloadAsync } from '../utils/encryption.util.js';

export async function decryptRequest(req: Request, _res: Response, next: NextFunction) {
  if (req.body && req.body.iv && req.body.data) {
    try {
      const decrypted = await decryptPayloadAsync(req.body.iv, req.body.data);
      if (decrypted && typeof decrypted === 'object') {
        req.body = decrypted;
      }
    } catch (error) {
      console.error("Decryption error:", error);
      // We do not stop the request here, validation will catch bad payloads
    }
  }
  next();
}
