const crypto = require('crypto');
const CryptoJS = require('crypto-js');

const ENCRYPTION_KEY = "5e8f1b6238b7d413e18a8b278a9a21235e8f1b6238b7d413e18a8b278a9a2123";

// Frontend encrypt
function frontendEncrypt(payload) {
  const text = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const key = CryptoJS.enc.Hex.parse(ENCRYPTION_KEY);
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

// Backend decrypt
function backendDecrypt(ivHex, encryptedHex) {
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return JSON.parse(decrypted);
}

const payload = { email: "test@example.com", password: "password" };
const encrypted = frontendEncrypt(payload);
console.log("Encrypted:", encrypted);
try {
  const decrypted = backendDecrypt(encrypted.iv, encrypted.data);
  console.log("Decrypted successfully:", decrypted);
} catch (e) {
  console.error("Backend failed to decrypt:", e.message);
}
