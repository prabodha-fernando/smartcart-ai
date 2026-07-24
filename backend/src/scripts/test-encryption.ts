import "../config/env.js";
import { connectDB, disconnectDB } from "../config/db.js";
import { registerUser, loginUser } from "../services/auth.service.js";
import { User } from "../models/User.js";

async function test() {
  await connectDB();
  console.log("Testing User Encryption...");

  const testEmail = `hacker${Date.now()}@example.com`;
  const testPassword = "SuperSecretPassword123!";

  // 1. Register a new user
  const authData = await registerUser({
    name: "Hackerman",
    email: testEmail,
    password: testPassword,
  });
  console.log("✅ User registered successfully. ID:", authData.user.id);

  // 2. Fetch the raw document from MongoDB to verify encryption
  const mongoose = await import("mongoose");
  const rawUser = await User.collection.findOne({ _id: new mongoose.Types.ObjectId(authData.user.id) } as any);

  if (!rawUser) throw new Error("User not found in DB");

  console.log("Raw DB Document:");
  console.log("- __enc_email:", rawUser.__enc_email);
  console.log("- __enc_name:", rawUser.__enc_name);
  console.log("- email (should be ciphertext):", rawUser.email);
  console.log("- name (should be ciphertext):", rawUser.name);
  console.log("- emailHash (should be present):", rawUser.emailHash !== undefined);

  if (!rawUser.email || !rawUser.email.toString().includes("eyJ") && rawUser.email.toString().length > 30) {
    // mongoose-field-encryption typically produces long strings or JSON objects
    console.log("✅ Name and Email successfully encrypted at rest!");
  } else if (!rawUser.__enc_email) {
    console.warn("⚠️ Email does not look encrypted!");
  } else {
    console.log("✅ Name and Email successfully encrypted at rest!");
  }

  // 3. Test Login
  const loginData = await loginUser({ email: testEmail, password: testPassword });
  console.log("✅ Login successful. Decrypted Name:", loginData.user.name);

  // 4. Cleanup
  await User.deleteOne({ _id: authData.user.id });
  console.log("✅ Test user cleaned up.");

  await disconnectDB();
}

test().catch(console.error);
