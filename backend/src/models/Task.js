import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
      ref: "User"
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    inputText: {
      type: String,
      required: true
    },
    operation: {
      type: String,
      required: true,
      enum: ["uppercase", "lowercase", "reverse", "word_count"]
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "running", "success", "failed"],
      default: "pending",
      index: true
    },
    result: {
      type: String,
      default: ""
    },
    logs: {
      type: [String],
      default: []
    },
    error: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

taskSchema.index({ userId: 1, createdAt: -1 });
taskSchema.index({ status: 1, updatedAt: -1 });

export const Task = mongoose.model("Task", taskSchema);
