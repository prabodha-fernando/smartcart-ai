import { Request, Response, NextFunction } from 'express';
import { encryptPayloadAsync } from '../utils/encryption.util.js';

export function encryptResponse(_req: Request, res: Response, next: NextFunction) {
  // Store the original res.json
  const originalJson = res.json.bind(res);
  
  // Override res.json to optionally await encryption
  res.json = function (body: any) {
    // Prevent double encryption and only encrypt objects
    const isAlreadyEncrypted = 
      body && 
      typeof body === 'object' && 
      Object.keys(body).length === 2 && 
      typeof body.iv === 'string' && 
      typeof body.data === 'string';

    if (body && typeof body === 'object' && !isAlreadyEncrypted) {
      encryptPayloadAsync(body)
        .then(encrypted => originalJson(encrypted))
        .catch(error => {
          console.error("Encryption error:", error);
          originalJson(body);
        });
      // Express res.json doesn't actually need to return anything synchronously that matters
      return this;
    }
    
    return originalJson(body);
  };
  
  next();
}
