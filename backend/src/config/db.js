import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDb() {
  mongoose.set("strictQuery", true);
  const uri = env.mongoUri.includes("/?") || env.mongoUri.match(/\/[a-zA-Z0-9_]+\?/)
    ? env.mongoUri
    : env.mongoUri.replace(/\/$/, "") + "/aitasks";
  await mongoose.connect(uri, {
    autoIndex: true
  });
}
