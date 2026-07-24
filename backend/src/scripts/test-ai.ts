import "../config/env.js";
import { connectDB, disconnectDB } from "../config/db.js";
import { resolveAiChat } from "../services/ai.service.js";

async function test() {
  await connectDB();
  console.log("Testing AI Chat...");
  
  const result = await resolveAiChat({
    messages: [{ role: "user", content: "I am looking for a laptop under $1000" }],
    lastProducts: []
  });
  
  console.log("AI Response Intent:", result.intent);
  console.log("AI Response Reply:", result.reply);
  console.log("Products Found:", result.products.length);
  
  await disconnectDB();
}

test().catch(console.error);
