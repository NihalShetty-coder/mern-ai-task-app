import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDb() {
  mongoose.set("strictQuery", true);
  let uri = env.mongoUri;
  uri = uri.split("?")[0] + "/aitasks?retryWrites=true&w=majority";
  console.log("Connecting to MongoDB:", uri.split("@")[0] + "@...");
  await mongoose.connect(uri, {
    autoCreate: true
  });
}
