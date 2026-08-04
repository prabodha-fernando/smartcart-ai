const axios = require('axios');
const CryptoJS = require('crypto-js');

const ENCRYPTION_KEY = "5e8f1b6238b7d413e18a8b278a9a21235e8f1b6238b7d413e18a8b278a9a2123";

function encrypt(payload) {
  const text = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const key = CryptoJS.enc.Hex.parse(ENCRYPTION_KEY);
  const iv = CryptoJS.lib.WordArray.random(16);
  const encrypted = CryptoJS.AES.encrypt(text, key, { iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
  return { iv: iv.toString(CryptoJS.enc.Hex), data: encrypted.ciphertext.toString(CryptoJS.enc.Hex) };
}

async function run() {
  try {
    const regPayload = encrypt({ name: "Test User", email: "test@example.com", password: "password123" });
    const regRes = await axios.post('http://localhost:4000/api/auth/register', regPayload);
    console.log("Registered:", regRes.status);
  } catch (err) {
    if (err.response && err.response.status === 409) {
      console.log("Already registered");
    } else {
      console.error("Register failed:", err.response ? err.response.data : err.message);
    }
  }

  try {
    const loginPayload = encrypt({ email: "test@example.com", password: "password123" });
    const loginRes = await axios.post('http://localhost:4000/api/auth/login', loginPayload);
    console.log("Login success:", loginRes.status);
  } catch (err) {
    console.error("Login failed:", err.response ? err.response.data : err.message);
  }
}
run();
