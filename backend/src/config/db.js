import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDb() {
  mongoose.set("strictQuery", true);
  let uri = env.mongoUri;
  uri = uri.split("?")[0] + "/test?retryWrites=true&w=majority";
  console.log("MongoDB connecting to:", uri.replace(/\/\/[^@]+@/, "//user:pass@"));
  await mongoose.connect(uri, {
    autoCreate: true
  });
}