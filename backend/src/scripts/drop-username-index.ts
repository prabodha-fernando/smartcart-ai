import mongoose from "mongoose";
import { env } from "../config/env.js";

/**
 * One-off maintenance: remove the stale `username_1` unique index left over
 * from an older User schema. The current schema has no `username` field, so
 * every new user has `username: null`, and the unique index rejects the
 * second such document. Dropping the index does NOT delete any user data.
 */
async function main() {
  await mongoose.connect(env.MONGODB_URI);
  const db = mongoose.connection.db;
  if (!db) throw new Error("No db handle");

  const collection = db.collection("users");
  const indexes = await collection.indexes();
  const hasUsernameIndex = indexes.some((i) => i.name === "username_1");

  if (!hasUsernameIndex) {
    console.log("No 'username_1' index found — nothing to drop.");
  } else {
    await collection.dropIndex("username_1");
    console.log("Dropped stale 'username_1' index.");
  }

  console.log("\nRemaining indexes:");
  console.log(JSON.stringify(await collection.indexes(), null, 2));

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
