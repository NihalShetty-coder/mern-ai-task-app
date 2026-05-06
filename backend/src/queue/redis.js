import Redis from "ioredis";
import { env } from "../config/env.js";

const isSecure = env.redisUrl.startsWith("rediss://");

export const redis = new Redis(env.redisUrl, {
  tls: isSecure ? { rejectUnauthorized: false } : undefined,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

redis.on("error", (err) => console.error("Redis Client Error:", err));

export async function ensureStreamGroup() {
  try {
    await redis.xgroup("CREATE", env.redisStream, env.redisConsumerGroup, "$", "MKSTREAM");
  } catch (error) {
    if (!String(error.message || "").includes("BUSYGROUP")) {
      console.error("Redis XGROUP Error:", error);
      throw error;
    }
  }
}
