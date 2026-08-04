import { verifyAccessToken } from './shared/src/utils/token.js';
import jwt from 'jsonwebtoken';
import { env } from './shared/src/config/env.js';

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YTY5YTA2YzljMGEyMTAyMTBlOGQ1NWMiLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzg1MzA3NDk2LCJleHAiOjE3ODUzMDgzOTZ9.wKkpC2bOl02GeCeiD9v2eGgg2v-9bCt9FcskMCZ4DxY";

try {
  console.log("Secret length:", env.JWT_ACCESS_SECRET.length);
  const payload = verifyAccessToken(token);
  console.log("Payload:", payload);
} catch (e) {
  console.error("Verification failed:", e);
}
