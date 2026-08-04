import axios from 'axios';
import { encryptPayload, decryptPayload } from './shared/src/utils/encryption.util.js';
import { env } from './shared/src/config/env.js';
import { connectDB } from './shared/src/config/db.js';
import { Chat } from './shared/src/models/Chat.js';
import mongoose from 'mongoose';

async function run() {
  await connectDB();
  
  // 1. Login
  const loginPayload = encryptPayload({ email: "emily.johnson@x.dummyjson.com", password: "emilyspass" });
  const loginRes = await axios.post('http://localhost:4000/api/auth/login', loginPayload);
  const token = loginRes.data.data.accessToken; // Wait, is the login response encrypted?
  // Let's just use axios to hit the backend directly since it's easier to verify via UI.

  // Actually, I can just mock a token or use the UI. Let me just simulate a request using the token from the DB.
  await mongoose.disconnect();
}
run().catch(console.error);
