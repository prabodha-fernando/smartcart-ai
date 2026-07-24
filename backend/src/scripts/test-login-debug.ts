import mongoose from "mongoose";
import { User, hashEmail } from "../models/User.js";
import { env } from "../config/env.js";

async function run() {
  await mongoose.connect(env.MONGODB_URI);
  
  const email = "debug-401@example.com";
  const password = "password123";
  
  await User.deleteMany({ emailHash: hashEmail(email) });

  console.log("Creating user...");
  const user = await User.create({ name: "Debug User", email, password });
  console.log("User created with emailHash:", user.emailHash);
  
  console.log("Finding user by hash...");
  const searchHash = hashEmail(email);
  console.log("Search hash:", searchHash);
  const foundUser = await User.findOne({ emailHash: searchHash }).select("+password");
  console.log("Found user:", !!foundUser);
  if (foundUser) {
    console.log("Password matches:", await foundUser.comparePassword(password));
  } else {
    // List all users to see what's in the DB
    const allUsers = await User.find({});
    console.log("All users:", allUsers.map(u => ({ emailHash: u.emailHash, name: u.name, email: u.email })));
  }
  
  process.exit(0);
}
run();
