import "../config/env.js";
import { connectDB, disconnectDB } from "../config/db.js";
import { User } from "../models/User.js";

async function dropUsers() {
  await connectDB();
  await User.collection.drop().catch(() => {});
  console.log("Users collection dropped.");
  await disconnectDB();
}

dropUsers().catch(console.error);
