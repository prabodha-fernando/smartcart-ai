import crypto from 'crypto';
import { env } from '../config/env.js';
import { Worker } from 'node:worker_threads';
import { fileURLToPath, URL } from 'node:url';

const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = Buffer.from(env.ENCRYPTION_KEY, 'hex'); // 32 bytes from 64 hex characters
const IV_LENGTH = 16;

let worker: Worker;
let messageId = 0;
const pendingPromises = new Map<number, { resolve: (val: any) => void, reject: (err: Error) => void }>();

function getWorker() {
  if (!worker) {
    // It works with both .ts via tsx loader and .js in compiled dist.
    const isTs = import.meta.url.endsWith('.ts');
    const workerPath = fileURLToPath(new URL(`./encryption.worker.${isTs ? 'ts' : 'js'}`, import.meta.url));
    worker = new Worker(workerPath);
    
    worker.on('message', (msg) => {
      const p = pendingPromises.get(msg.id);
      if (p) {
        pendingPromises.delete(msg.id);
        if (msg.error) p.reject(new Error(msg.error));
        else p.resolve(msg.result || msg.status);
      }
    });
    
    worker.on('error', (err) => {
      console.error('Encryption Worker Error:', err);
    });

    // Initialize with key
    worker.postMessage({ id: ++messageId, action: 'init', key: env.ENCRYPTION_KEY });
  }
  return worker;
}

/**
 * Encrypts a payload asynchronously using a background worker thread.
 */
export async function encryptPayloadAsync(payload: unknown): Promise<{ iv: string; data: string }> {
  return new Promise((resolve, reject) => {
    const id = ++messageId;
    pendingPromises.set(id, { resolve, reject });
    getWorker().postMessage({ id, action: 'encrypt', payload });
  });
}

/**
 * Decrypts a payload asynchronously using a background worker thread.
 */
export async function decryptPayloadAsync(ivHex: string, encryptedHex: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const id = ++messageId;
    pendingPromises.set(id, { resolve, reject });
    getWorker().postMessage({ id, action: 'decrypt', iv: ivHex, data: encryptedHex });
  });
}

// Fallbacks for purely synchronous cases if needed elsewhere (though discouraged)
export function encryptPayload(payload: unknown): { iv: string; data: string } {
  const text = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return {
    iv: iv.toString('hex'),
    data: encrypted,
  };
}

export function decryptPayload(ivHex: string, encryptedHex: string): any {
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  try {
    return JSON.parse(decrypted);
  } catch (e) {
    return decrypted;
  }
}
