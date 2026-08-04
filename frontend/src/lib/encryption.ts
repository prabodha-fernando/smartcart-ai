import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || "";

/**
 * Decrypts an AES-256-CBC encrypted payload from the backend.
 * The backend sends `{ iv: string, data: string }` where both are hex-encoded.
 */
export function decryptPayload(ivHex: string, encryptedHex: string): any {
  if (!ENCRYPTION_KEY) return null;

  // Convert hex strings to CryptoJS WordArrays
  const key = CryptoJS.enc.Hex.parse(ENCRYPTION_KEY);
  const iv = CryptoJS.enc.Hex.parse(ivHex);
  
  // CryptoJS AES.decrypt works best with a base64 string representation of the ciphertext
  const ciphertextBase64 = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Hex.parse(encryptedHex));
  
  // Decrypt using AES-CBC
  const decrypted = CryptoJS.AES.decrypt(ciphertextBase64, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });

  const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
  
  try {
    return JSON.parse(decryptedText);
  } catch (e) {
    return decryptedText;
  }
}

/**
 * Encrypts a payload into AES-256-CBC to send to the backend.
 */
export function encryptPayload(payload: unknown): { iv: string; data: string } {
  if (!ENCRYPTION_KEY) throw new Error("Missing ENCRYPTION_KEY");
  
  const text = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const key = CryptoJS.enc.Hex.parse(ENCRYPTION_KEY);
  
  // Generate a random 16-byte IV
  const iv = CryptoJS.lib.WordArray.random(16);
  
  const encrypted = CryptoJS.AES.encrypt(text, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });

  return {
    iv: iv.toString(CryptoJS.enc.Hex),
    data: encrypted.ciphertext.toString(CryptoJS.enc.Hex)
  };
}
