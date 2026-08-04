import { parentPort } from 'node:worker_threads';
import crypto from 'node:crypto';
let ENCRYPTION_KEY = null;
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;
parentPort?.on('message', (msg) => {
    if (msg.action === 'init') {
        ENCRYPTION_KEY = Buffer.from(msg.key, 'hex');
        parentPort?.postMessage({ id: msg.id, status: 'ok' });
    }
    else if (msg.action === 'encrypt') {
        try {
            if (!ENCRYPTION_KEY)
                throw new Error("Worker not initialized with encryption key");
            const text = typeof msg.payload === 'string' ? msg.payload : JSON.stringify(msg.payload);
            const iv = crypto.randomBytes(IV_LENGTH);
            const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            parentPort?.postMessage({ id: msg.id, result: { iv: iv.toString('hex'), data: encrypted } });
        }
        catch (err) {
            parentPort?.postMessage({ id: msg.id, error: err.message });
        }
    }
    else if (msg.action === 'decrypt') {
        try {
            if (!ENCRYPTION_KEY)
                throw new Error("Worker not initialized with encryption key");
            const iv = Buffer.from(msg.iv, 'hex');
            const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
            let decrypted = decipher.update(msg.data, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            let parsed;
            try {
                parsed = JSON.parse(decrypted);
            }
            catch (e) {
                parsed = decrypted;
            }
            parentPort?.postMessage({ id: msg.id, result: parsed });
        }
        catch (err) {
            parentPort?.postMessage({ id: msg.id, error: err.message });
        }
    }
});
