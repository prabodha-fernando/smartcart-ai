const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const uri = "mongodb+srv://smartcart_admin:Admin123@smartcart-db.ctrn8tn.mongodb.net/smartcart?retryWrites=true&w=majority&appName=smartcart-db";

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('smartcart');

    // Drop the old emailHash index if it exists
    try {
      await db.collection('users').dropIndex('emailHash_1');
      console.log("Dropped emailHash_1 index.");
    } catch (e) {
      console.log("emailHash_1 index might not exist or already dropped.");
    }

    const passwordHash = await bcrypt.hash("emilyspass", 12);

    // Check if emily exists
    const existing = await db.collection('users').findOne({ email: "emily.johnson@x.dummyjson.com" });
    if (!existing) {
      await db.collection('users').insertOne({
        name: "Emily Johnson",
        email: "emily.johnson@x.dummyjson.com",
        password: passwordHash,
        tokenVersion: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log("Emily inserted successfully.");
    } else {
      console.log("Emily already exists.");
    }
  } finally {
    await client.close();
  }
}
run();
