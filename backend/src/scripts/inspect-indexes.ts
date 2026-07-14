import mongoose from "mongoose";
import { env } from "../config/env.js";

async function main() {
  await mongoose.connect(env.MONGODB_URI);
  const db = mongoose.connection.db;
  if (!db) throw new Error("No db handle");

  const collection = db.collection("users");
  const indexes = await collection.indexes();
  console.log("Indexes on 'users':");
  console.log(JSON.stringify(indexes, null, 2));

  const nullUsernameCount = await collection.countDocuments({ username: null });
  const totalCount = await collection.countDocuments({});
  console.log(`\nDocuments total: ${totalCount}`);
  console.log(`Documents with username=null: ${nullUsernameCount}`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
