import { connectDB } from "@smartcart/shared";
import { createApp } from "./app.js";

async function start() {
  await connectDB();
  const app = createApp();
  const PORT = process.env.PORT || 4002;
  app.listen(PORT, () => console.log(`Order Service running on port ${PORT}`));
}
start();
