const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://smartcart_admin:Admin123@smartcart-db.ctrn8tn.mongodb.net/smartcart?retryWrites=true&w=majority&appName=smartcart-db";

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('smartcart');
    const users = await db.collection('users').find({}).toArray();
    console.log("Users in DB:", users.map(u => u.email));
  } finally {
    await client.close();
  }
}
run();
