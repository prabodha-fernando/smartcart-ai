const { encryptPayload } = require('./shared/dist/utils/encryption.util.js');

const body = { success: true, message: 'Cart fetched successfully', data: { cart: { items: [] } } };

try {
  const encrypted = encryptPayload(body);
  console.log("Success:", encrypted);
} catch (e) {
  console.error("Encryption error:", e);
}
