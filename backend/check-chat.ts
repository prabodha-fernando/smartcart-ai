import { connectDB } from './shared/src/config/db.js';
import { Chat } from './shared/src/models/Chat.js';
import mongoose from 'mongoose';

async function run() {
  await connectDB();
  const chats = await Chat.find({});
  console.log("Total chats in DB:", chats.length);
  if (chats.length > 0) {
    console.log("First chat:", chats[0]);
  }
  await mongoose.disconnect();
}
run().catch(console.error);
