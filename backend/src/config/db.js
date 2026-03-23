import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

let isConnected = false;

export async function initDB() {
  if (isConnected) return;

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI is not set in environment");
  }

  await mongoose.connect(mongoUri, {
    tls: true,
    // Helps fail fast with a clear error when Atlas networking/IP rules block access.
    serverSelectionTimeoutMS: 15000,
  });
  isConnected = true;
  console.log("[db] MongoDB connected");
}
