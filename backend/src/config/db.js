import mongoose from "mongoose";
import { env } from "./env.js";

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
  await mongoose.connect(uri, {
    autoCreate: true
  });
}