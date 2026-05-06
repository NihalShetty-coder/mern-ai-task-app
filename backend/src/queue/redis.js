import Redis from "ioredis";
import { env } from "../config/env.js";

export const redis = new Redis(env.redisUrl);

export async function ensureStreamGroup() {
  try {
    await redis.xgroup("CREATE", env.redisStream, env.redisConsumerGroup, "$", "MKSTREAM");
  } catch (error) {
    if (!String(error.message || "").includes("BUSYGROUP")) {
      throw error;
    }
  }
}
