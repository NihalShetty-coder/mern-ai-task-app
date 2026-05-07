import express from "express";
import { Task } from "../models/Task.js";
import { authRequired } from "../middleware/auth.js";
import { redis, ensureStreamGroup } from "../queue/redis.js";
import { env } from "../config/env.js";

const router = express.Router();

router.use(authRequired);

router.get("/", async (req, res, next) => {
  try {
    const tasks = await Task.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean();
    return res.json(tasks);
  } catch (error) {
    return next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { title, inputText, operation } = req.body;
    if (!title || !inputText || !operation) {
      return res.status(400).json({ message: "Title, inputText, and operation required" });
    }

    const task = await Task.create({
      userId: req.user.id,
      title,
      inputText,
      operation,
      status: "pending"
    });

    return res.status(201).json(task);
  } catch (error) {
    return next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.user.id }).lean();
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    console.log("Fetched task:", task._id, "status:", task.status, "result:", task.result);
    return res.json(task);
  } catch (error) {
    return next(error);
  }
});

router.post("/:id/run", async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.user.id });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (task.status === "running") {
      return res.status(409).json({ message: "Task already running" });
    }

    task.status = "pending";
    task.error = "";
    task.logs = [`Queued at ${new Date().toISOString()}`];
    await task.save();

    await ensureStreamGroup();
    await redis.xadd(
      env.redisStream,
      "*",
      "taskId",
      String(task._id),
      "userId",
      String(task.userId),
      "operation",
      task.operation,
      "inputText",
      task.inputText
    );

    return res.status(202).json({ message: "Task queued" });
  } catch (error) {
    return next(error);
  }
});

export default router;
