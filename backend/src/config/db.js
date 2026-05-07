import mongoose from "mongoose";
import { env } from "./env.js";

function buildMongoUri(base, db) {
  if (base.includes("+srv")) {
    return base.split("?")[0] + "/" + db + "?retryWrites=true&w=majority";
  }
  return base.split("?")[0] + "/" + db + "?retryWrites=true&w=majority";
}

export async function connectDb() {
  mongoose.set("strictQuery", true);
  const uri = buildMongoUri(env.mongoUri, "test");
  console.log("MongoDB connecting to:", uri.replace(/\/\/[^@]+@/, "//user:pass@"));
  await mongoose.connect(uri, {
    autoCreate: true
  });
}