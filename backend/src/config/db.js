import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDb() {
  mongoose.set("strictQuery", true);
  let uri = env.mongoUri;
  const hasDb = uri.match(/\/[a-zA-Z0-9_]+\?/);
  if (!hasDb) {
    const base = uri.split("?")[0];
    uri = base + "/aitasks?retryWrites=true&w=majority";
  }
  console.log("MongoDB connecting to:", uri.replace(/\/\/[^@]+@/, "//user:pass@"));
  await mongoose.connect(uri, {
    autoCreate: true
  });
}