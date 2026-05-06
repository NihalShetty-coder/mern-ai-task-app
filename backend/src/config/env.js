import dotenv from "dotenv";

dotenv.config();

const required = ["MONGO_URI", "JWT_SECRET", "REDIS_URL"];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}`);
  }
}

export const env = {
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  redisUrl: process.env.REDIS_URL,
  redisStream: process.env.REDIS_STREAM || "task_stream",
  redisConsumerGroup: process.env.REDIS_CONSUMER_GROUP || "workers",
  redisConsumerName: process.env.REDIS_CONSUMER_NAME || "api"
};
