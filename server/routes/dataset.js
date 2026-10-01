import express from "express";
import { Dataset } from "../models/Dataset.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const doc = await Dataset.findOne({ userId: req.userId });

    if (!doc) {
      return res.json({ data: [], fileName: null, analysis: null, aiAnalysis: null, calculatedColumns: {}, history: [] });
    }

    res.json({
      data: doc.data,
      fileName: doc.fileName,
      analysis: doc.analysis,
      aiAnalysis: doc.aiAnalysis,
      calculatedColumns: doc.calculatedColumns ?? {},
      history: doc.history,
    });
  } catch (error) {
    console.error("===== DATASET LOAD ERROR =====");
    console.error(error);

    res.status(500).json({ error: "Failed to load your saved data." });
  }
});

router.put("/", async (req, res) => {
  try {
    const { data, fileName, analysis, aiAnalysis, calculatedColumns, history } = req.body;

    await Dataset.findOneAndUpdate(
      { userId: req.userId },
      {
        data: Array.isArray(data) ? data : [],
        fileName: typeof fileName === "string" ? fileName : null,
        analysis: analysis ?? null,
        aiAnalysis: aiAnalysis ?? null,
        calculatedColumns: calculatedColumns && typeof calculatedColumns === "object" ? calculatedColumns : {},
        history: Array.isArray(history) ? history : [],
        updatedAt: new Date(),
      },
      { upsert: true },
    );

    res.json({ ok: true });
  } catch (error) {
    console.error("===== DATASET SAVE ERROR =====");
    console.error(error);

    res.status(500).json({ error: "Failed to save your data." });
  }
});

export default router;
