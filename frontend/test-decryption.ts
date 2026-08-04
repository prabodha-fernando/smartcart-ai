import { decryptPayload } from "./src/lib/encryption";
import axios from "axios";
import CryptoJS from "crypto-js";

// Hardcode for testing
process.env.NEXT_PUBLIC_ENCRYPTION_KEY = "5e8f1b6238b7d413e18a8b278a9a21235e8f1b6238b7d413e18a8b278a9a2123";

async function test() {
  const res = await axios.post("http://localhost:4000/api/ai/chat", {
    messages: [{ role: "user", content: "I am looking for a laptop under $1000" }],
    lastProducts: []
  });
  
  const ivHex = res.data.iv;
  const encryptedHex = res.data.data;
  
  const key = CryptoJS.enc.Hex.parse(process.env.NEXT_PUBLIC_ENCRYPTION_KEY || "");
  const iv = CryptoJS.enc.Hex.parse(ivHex);
  
  const ciphertextBase64 = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Hex.parse(encryptedHex));
  
  const decrypted = CryptoJS.AES.decrypt(ciphertextBase64, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });

  const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
  console.log("CryptoJS Decrypted AI output:", JSON.parse(decryptedText));
}

test().catch(console.error);
