import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import authRoutes from "./routes/auth.js";
import taskRoutes from "./routes/tasks.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("tiny"));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
  handler: (req, res) => {
    res.status(429).json({ message: "Too many requests, please try again later." });
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authLimiter, authRoutes);
app.use("/tasks", taskRoutes);

app.use(errorHandler);

await connectDb();

app.listen(env.port, () => {
  console.log(`API listening on ${env.port}`);
});
