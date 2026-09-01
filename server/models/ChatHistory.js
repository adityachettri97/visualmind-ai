import mongoose from "mongoose";

// One document per user, mirroring the Dataset model's shape — a single field synced whole on
// every change rather than modeling individual messages.
const chatHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  messages: {
    type: [mongoose.Schema.Types.Mixed],
    default: [],
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export const ChatHistory = mongoose.model("ChatHistory", chatHistorySchema);
