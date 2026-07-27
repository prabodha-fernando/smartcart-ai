import { connectDB, disconnectDB } from "../config/db.js";
import { User } from "../models/User.js";

/**
 * Seeds a demo account for local API testing. Idempotent — safe to run repeatedly.
 *
 *   npm run seed
 */
const DEMO_USER = {
  name: "Emily Johnson",
  email: "emily.johnson@x.dummyjson.com",
  password: "emilyspass",
};

async function seed() {
  await connectDB();

  const existing = await User.findOne({ email: DEMO_USER.email });
  if (existing) {
    console.log(`✓ Demo user "${DEMO_USER.email}" already exists - skipping.`);
  } else {
    await User.create(DEMO_USER);
    console.log(
      `✓ Created demo user "${DEMO_USER.email}" (password: ${DEMO_USER.password}).`
    );
  }

  await disconnectDB();
}

seed().catch(async (err) => {
  console.error("Seed failed:", err instanceof Error ? err.message : err);
  await disconnectDB();
  process.exit(1);
});
