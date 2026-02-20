require("dotenv").config();

const { MongoClient } = require("mongodb");

async function test() {
  try {
    const uri = process.env.MONGO_URI;

    if (!uri) {
      throw new Error("Missing MONGO_URI");
    }

    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 8000,
    });

    await client.connect();

    console.log("✅ CONNECTED OK");

    await client.close();
  } catch (err) {
    console.error("❌ CONNECT FAIL:", err.message);
  }
}

test();
