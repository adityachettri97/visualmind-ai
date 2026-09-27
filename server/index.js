import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import Groq from "groq-sdk";
import { connectDB } from "./db.js";
import authRoutes from "./routes/auth.js";
import datasetRoutes from "./routes/dataset.js";
import chatHistoryRoutes from "./routes/chatHistory.js";

dotenv.config();

const app = express();

// Render (like most PaaS hosts) terminates HTTPS at a reverse proxy in front of the app — this
// makes Express trust its X-Forwarded-* headers, so req.ip reports the real client IP (used by
// the login-location tracking in routes/auth.js) instead of the proxy's own address.
app.set("trust proxy", 1);

// Allow both local development and the Netlify front-end origin, while still honoring a custom
// Render-supplied CLIENT_ORIGIN for production. Requests with no Origin (curl/Postman/mobile)
// are permitted as well, so the app works outside the browser.
const allowedOrigins = [
  "http://localhost:5173",
  "https://visualmindai.netlify.app",
  process.env.CLIENT_ORIGIN,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);
// Default express.json() limit is 100kb — a JSON-stringified CSV of any real size blows past
// that, so /api/analyze failed with HTTP 413 before the request handler ever ran.
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

connectDB();

app.use("/api/auth", authRoutes);
app.use("/api/dataset", datasetRoutes);
app.use("/api/chat-history", chatHistoryRoutes);

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// This account's Groq tier caps at 8000 tokens/minute for this model, shared between prompt and
// completion (Groq counts the *requested* max_completion_tokens against this, not actual usage).
// A fixed row count doesn't actually bound token size — a 10-column CSV is ~3x heavier per row
// than a 3-column one — so this bounds by estimated JSON size instead, shrinking the row count
// for wide datasets and allowing more rows for narrow ones. Sampled evenly across the whole
// dataset (not just the first N rows) so a "top product" answer isn't biased toward whatever
// sorts first.
const CHARS_PER_TOKEN = 4; // rough heuristic for English/JSON text

function estimateTokens(text) {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

function sampleRows(dataset, maxRows) {
  if (dataset.length <= maxRows) return dataset;

  const step = dataset.length / maxRows;

  return Array.from({ length: maxRows }, (_, i) => dataset[Math.floor(i * step)]);
}

function sampleDatasetToTokenBudget(dataset, maxTokens, maxRows = 100) {
  let rows = Math.min(dataset.length, maxRows);
  let sample = sampleRows(dataset, rows);

  while (estimateTokens(JSON.stringify(sample)) > maxTokens && rows > 5) {
    rows = Math.max(5, Math.floor(rows * 0.7));
    sample = sampleRows(dataset, rows);
  }

  return sample;
}

app.post("/api/analyze", async (req, res) => {
  try {
    const { dataset } = req.body;

    if (!dataset || !Array.isArray(dataset) || dataset.length === 0) {
      return res.status(400).json({
        error: "Dataset is required.",
      });
    }

    console.log("===== GROQ ANALYSIS REQUEST =====");
    console.log("Rows:", dataset.length);

    const sampledDataset = sampleDatasetToTokenBudget(dataset, 1200);
    const sampleNote =
      sampledDataset.length < dataset.length
        ? `\n\nNote: this is an evenly-spaced sample of ${sampledDataset.length} rows out of ${dataset.length} total — describe patterns as approximate, not exact counts.`
        : "";

    console.log("Sampled to:", sampledDataset.length, "rows,", "~", estimateTokens(JSON.stringify(sampledDataset)), "tokens");

    const prompt = `
You are an analytics AI for VisualMind AI.

Analyze the following dataset.

Dataset:
${JSON.stringify(sampledDataset)}${sampleNote}

Return ONLY valid JSON in this exact structure:

{
  "insights": [
    "short insight",
    "short insight",
    "short insight"
  ],
  "recommendations": [
    "short recommendation",
    "short recommendation"
  ],
 "graph": {
  "topProduct": "product name",
  "topProductValue": "value",
  "topRegion": "region name",
  "highlightedProducts": [
    "product name",
    "product name",
    "product name"
  ],
  "highlightedRegion": "region name"
},
"dataQuality": {
  "rating": "good | fair | poor",
  "issues": [
    "short issue"
  ],
  "suggestions": [
    "short, actionable suggestion"
  ]
}
}

Rules:
- Use only information present in the dataset.
- Do not invent statistics.
- Keep insights concise.
- Identify important patterns.
- Identify the top-performing product if possible.
- Identify the strongest region if a region column exists.
- Provide practical recommendations.

- For topProduct, return the exact product name from the dataset.
- For topProductValue, return the actual numeric sales/value from the dataset.
- For topRegion, return the exact region name from the dataset.

- highlightedProducts must contain exactly 3 products.
- Select the 3 highest-selling products based on the numeric sales/value column.
- Return the exact product names as they appear in the dataset.
- Do not omit a product if 3 valid products exist.

- highlightedRegion must contain the strongest region.
- Return the exact region name from the dataset.

- For dataQuality, assess the dataset itself (not the business performance it describes):
  - Consider row count (very few rows limits how meaningful any analysis can be), missing/blank
    values, whether there's a usable numeric column and a usable categorical/grouping column,
    inconsistent formatting within a column, duplicate-looking rows, and outlier values that look
    like data-entry errors.
  - rating "good": no notable issues — issues and suggestions can be empty arrays.
  - rating "fair" or "poor": list the concrete issues you actually observed in issues, and give
    specific, actionable suggestions in suggestions (e.g. "add a Region or Category column so
    performance can be broken down by group", "fill in the missing values in the Sales column",
    "add more rows — 4 rows is too few to identify a reliable trend").
  - Never invent an issue that isn't actually present in the sampled data.

- Return valid JSON only.
`;

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [
        {
          role: "system",
          content: "You are a data analytics assistant. Return only valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.2,
      // openai/gpt-oss-20b is a reasoning model — without headroom it can spend its entire
      // token budget "thinking" and hit the length limit before writing any visible output,
      // returning an empty response. reasoning_effort keeps that budget in check to begin with.
      // Kept well under this account's 8000 tokens/minute cap (shared with the prompt). Groq
      // counts the *requested* max_completion_tokens against that cap regardless of actual
      // usage, and this reasoning model can burn a lot of it on internal chain-of-thought even
      // at low effort — so the dataset sample above is kept small specifically to leave this
      // as much headroom as possible, rather than splitting the budget evenly.
      max_completion_tokens: 5500,
      reasoning_effort: "low",
    });

    const response = completion.choices[0]?.message?.content;

    console.log("===== GROQ RESPONSE =====");
    console.log(response);

    if (!response) {
      const finishReason = completion.choices[0]?.finish_reason;

      throw new Error(
        finishReason === "length"
          ? "The AI ran out of room analyzing this dataset before it could respond. Try a smaller dataset."
          : "Groq returned an empty response.",
      );
    }

    const cleanedResponse = response
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const analysis = JSON.parse(cleanedResponse);

    console.log("===== PARSED GROQ ANALYSIS =====");
    console.log(analysis);

    res.json(analysis);
  } catch (error) {
    console.error("===== GROQ ANALYSIS ERROR =====");
    console.error(error);

    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to analyze dataset.",
    });
  }
});

app.post("/api/chat", async (req, res) => {
  try {
    const { dataset, question, history } = req.body;

    if (!question || typeof question !== "string" || !question.trim()) {
      return res.status(400).json({
        error: "Question is required.",
      });
    }

    const sampledDataset = Array.isArray(dataset) ? sampleDatasetToTokenBudget(dataset, 1000) : [];
    const datasetContext =
      sampledDataset.length > 0
        ? `The user's uploaded dataset has ${dataset.length} rows. Here is an evenly-spaced sample of ${sampledDataset.length} of them as JSON:\n${JSON.stringify(sampledDataset)}`
        : "No dataset has been uploaded yet. If the question depends on data, tell the user to upload a CSV first.";

    // Keep a shorter, size-capped history — a handful of long prior AI answers could otherwise
    // add up to real token weight on top of the dataset sample.
    const MAX_HISTORY_MESSAGE_CHARS = 500;
    const priorMessages = Array.isArray(history)
      ? history
          .filter((message) => message && (message.role === "user" || message.role === "assistant") && typeof message.content === "string")
          .slice(-6)
          .map((message) => ({
            role: message.role,
            content:
              message.content.length > MAX_HISTORY_MESSAGE_CHARS
                ? `${message.content.slice(0, MAX_HISTORY_MESSAGE_CHARS)}…`
                : message.content,
          }))
      : [];

    console.log("===== GROQ CHAT REQUEST =====");
    console.log("Question:", question);

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [
        {
          role: "system",
          content: `You are the AI assistant inside VisualMind AI, a data visualization tool. Answer questions about the user's dataset concisely and accurately, using only the data provided below. Do not invent numbers. If the dataset can't answer the question, say so.\n\n${datasetContext}`,
        },
        ...priorMessages,
        {
          role: "user",
          content: question,
        },
      ],
      temperature: 0.3,
      max_completion_tokens: 5500,
      reasoning_effort: "low",
    });

    const answer = completion.choices[0]?.message?.content;

    if (!answer) {
      const finishReason = completion.choices[0]?.finish_reason;

      throw new Error(
        finishReason === "length"
          ? "The AI ran out of room answering that before it could respond. Try a shorter question."
          : "Groq returned an empty response.",
      );
    }

    res.json({ answer });
  } catch (error) {
    console.error("===== GROQ CHAT ERROR =====");
    console.error(error);

    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to get a response from the AI assistant.",
    });
  }
});

/** Keeps the AI's row objects rectangular — every row gets exactly the first row's columns,
    coerced to strings, regardless of what stray/missing keys the model actually produced. */
function normalizeGeneratedRows(rawRows) {
  if (!Array.isArray(rawRows) || rawRows.length === 0) return [];

  const columns = Object.keys(rawRows[0] ?? {});

  if (columns.length === 0) return [];

  return rawRows
    .filter((row) => row && typeof row === "object")
    .map((row) => {
      const clean = {};

      columns.forEach((column) => {
        const value = row[column];

        clean[column] = value === undefined || value === null ? "" : String(value);
      });

      return clean;
    });
}

app.post("/api/generate-dataset", async (req, res) => {
  try {
    const { prompt, rowCount } = req.body;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({
        error: "A prompt is required.",
      });
    }

    // More rows means more actual output tokens, which raises the odds of hitting the
    // reasoning-model's length limit mid-JSON — kept modest for the same reason the dataset
    // sample sizes above are kept small (see the TPM comment near the top of this file).
    const clampedRowCount = Math.min(30, Math.max(3, Math.round(Number(rowCount)) || 15));

    console.log("===== GROQ DATASET GENERATION REQUEST =====");
    console.log("Prompt:", prompt, "Rows:", clampedRowCount);

    const generationPrompt = `
You are a synthetic dataset generator for VisualMind AI, a 3D data visualization tool.

Generate a realistic, plausible dataset for this request: "${prompt.trim()}"

Requirements:
- Generate exactly ${clampedRowCount} rows.
- Choose sensible column names based on the request (e.g. Product, Category, Region, Sales, Date).
- Include at least one numeric column (a quantity, amount, price, or score) so the data can be sized visually.
- Include at least one short categorical/text column suitable for grouping and coloring (e.g. category, region, department, status), when the request reasonably supports it.
- Every row must use the exact same column names.
- All values must be strings, even numbers (e.g. "42000", not 42000). Dates must use YYYY-MM-DD format.
- Do not invent a column called "id" — a row identifier is already handled elsewhere.
- Do not include commentary, explanations, markdown, or code fences.

Return ONLY valid JSON in this exact structure:
{
  "fileName": "short descriptive dataset name without file extension, e.g. Employee Salaries",
  "rows": [
    { "ColumnA": "value", "ColumnB": "value" }
  ]
}
`;

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [
        {
          role: "system",
          content: "You are a synthetic dataset generator. Return only valid JSON.",
        },
        {
          role: "user",
          content: generationPrompt,
        },
      ],
      temperature: 0.7,
      max_completion_tokens: 6000,
      reasoning_effort: "low",
    });

    const response = completion.choices[0]?.message?.content;

    console.log("===== GROQ DATASET GENERATION RESPONSE =====");
    console.log(response);

    if (!response) {
      const finishReason = completion.choices[0]?.finish_reason;

      throw new Error(
        finishReason === "length"
          ? "The AI ran out of room generating this dataset. Try fewer rows or a simpler prompt."
          : "Groq returned an empty response.",
      );
    }

    const cleanedResponse = response
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const parsed = JSON.parse(cleanedResponse);
    const rows = normalizeGeneratedRows(parsed.rows);

    if (rows.length === 0) {
      throw new Error("The AI didn't return any usable rows. Try rephrasing your prompt.");
    }

    res.json({
      fileName: typeof parsed.fileName === "string" && parsed.fileName.trim() ? parsed.fileName.trim() : "AI Generated Dataset",
      rows,
    });
  } catch (error) {
    console.error("===== GROQ DATASET GENERATION ERROR =====");
    console.error(error);

    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to generate dataset.",
    });
  }
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
  });
});

// Render (and most PaaS hosts) assign the port dynamically via $PORT — the app must listen on
// whatever it provides, not a fixed port, or the deployed service is unreachable.
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`VisualMind AI server running on port ${PORT}`);
});
