import mongoose from "mongoose";
import { env } from "./env.js";

async function connectWithRetry(uri, retries = 5) {
  for (let i = 0; i < retries; i++) {
    try {
      await mongoose.connect(uri, { autoCreate: true });
      console.log("MongoDB connected successfully");
      return;
    } catch (err) {
      console.error(`MongoDB connection attempt ${i + 1} failed:`, err.message);
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
      }
    }
  }
  throw new Error("Failed to connect to MongoDB after retries");
}

function buildMongoUri(rawUri, dbName) {
  const [base, query] = rawUri.split('?');
  // Remove trailing slash from base to avoid double slashes
  const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const newUri = `${cleanBase}/${dbName}`;
  return query ? `${newUri}?${query}` : newUri;
}

export async function connectDb() {
  mongoose.set("strictQuery", true);
  const uri = buildMongoUri(env.mongoUri, "test");
  console.log("MongoDB connecting to:", uri.replace(/\/\/[^@]+@/, "//user:pass@"));
  await connectWithRetry(uri);
}

export async function connectDb() {
  mongoose.set("strictQuery", true);
  const uri = buildMongoUri(env.mongoUri, "test");
  console.log("MongoDB connecting to:", uri.replace(/\/\/[^@]+@/, "//user:pass@"));
  await mongoose.connect(uri, {
    autoCreate: true
  });
}