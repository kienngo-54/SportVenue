// db.js
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

const client = new MongoClient("mongodb+srv://duckien44:kien4420@cluster0.sldzf2a.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function connectToDB() {
  try {
    if (!client.isConnected) {
      await client.connect();  // Kết nối MongoDB khi server khởi động
      console.log('Connected to MongoDB');
    }
    return client.db('managefield');
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
    throw err;
  }
}

async function closeDBConnection() {
  await client.close();
  console.log('MongoDB connection closed');
}

module.exports = { connectToDB, closeDBConnection, client };
