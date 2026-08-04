import { connectDB } from "@smartcart/shared";
import { createApp } from "./app.js";

async function start() {
  await connectDB();
  const app = createApp();
  const PORT = process.env.PORT || 4003;
  app.listen(PORT, () => console.log(`AI Service running on port ${PORT}`));
}
start();
