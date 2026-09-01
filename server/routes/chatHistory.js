import express from "express";
import { ChatHistory } from "../models/ChatHistory.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const doc = await ChatHistory.findOne({ userId: req.userId });

    res.json({ messages: doc ? doc.messages : [] });
  } catch (error) {
    console.error("===== CHAT HISTORY LOAD ERROR =====");
    console.error(error);

    res.status(500).json({ error: "Failed to load your chat history." });
  }
});

router.put("/", async (req, res) => {
  try {
    const { messages } = req.body;

    await ChatHistory.findOneAndUpdate(
      { userId: req.userId },
      { messages: Array.isArray(messages) ? messages : [], updatedAt: new Date() },
      { upsert: true },
    );

    res.json({ ok: true });
  } catch (error) {
    console.error("===== CHAT HISTORY SAVE ERROR =====");
    console.error(error);

    res.status(500).json({ error: "Failed to save your chat history." });
  }
});

export default router;
