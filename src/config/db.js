import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const uri = process.env.MONGO_URI;

let client;
let db;

export async function connectDB() {
  if (db) return db; // ✅ already connected হলে reuse

  try {
    client = new MongoClient(uri);
    await client.connect();

    db = client.db("mbstu_medical_system");

    console.log("✅ MongoDB connected");
    return db;
  } catch (err) {
    console.error("MongoDB connection error:", err);
    throw err;
  }
}

export function getDB() {
  if (!db) {
    throw new Error("Database not initialized. Call connectDB first.");
  }
  return db;
}