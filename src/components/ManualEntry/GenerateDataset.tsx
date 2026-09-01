import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { useDatasetStore } from "../../store/datasetStore";
import { analyzeDataset } from "../../utils/analyzeDataset";
import { analyzeWithAI, generateDatasetWithAI } from "../../services/aiService";

const MIN_ROWS = 3;
const MAX_ROWS = 30;

function GenerateDataset() {
  const { setDataset, setAILoading, setAIAnalysis, setAIError } = useDatasetStore();

  const [prompt, setPrompt] = useState("");
  const [rowCount, setRowCount] = useState(15);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt || isGenerating) return;

    setIsGenerating(true);
    setError(null);

    try {
      const { fileName, rows } = await generateDatasetWithAI(trimmedPrompt, rowCount);
      const newFileName = fileName.toLowerCase().endsWith(".csv") ? fileName : `${fileName}.csv`;

      setDataset(rows, newFileName, analyzeDataset(rows));
      setAILoading();

      analyzeWithAI(rows)
        .then((result) => setAIAnalysis(result))
        .catch((aiError) => {
          setAIError(aiError instanceof Error ? aiError.message : "Failed to analyze dataset with AI.");
        });

      setPrompt("");
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : "Failed to generate dataset.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="glass rounded-2xl p-4 sm:p-6">
      <h2 className="text-xl font-semibold">Generate Dataset with AI</h2>

      <p className="mt-2 text-sm text-slate-400">Describe the data you want, and AI will build a table for you — no CSV or manual entry needed.</p>

      <div className="mt-6">
        <label htmlFor="ai-dataset-prompt" className="text-sm font-medium text-slate-300">
          Prompt
        </label>

        <textarea
          id="ai-dataset-prompt"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder={'e.g. "20 fictional employees with Name, Department, and Salary"'}
          rows={3}
          disabled={isGenerating}
          className="mt-2 w-full resize-none rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm outline-none focus:border-violet-500 disabled:opacity-60"
        />
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-4">
        <div>
          <label htmlFor="ai-dataset-row-count" className="text-sm font-medium text-slate-300">
            Rows
          </label>

          <input
            id="ai-dataset-row-count"
            type="number"
            min={MIN_ROWS}
            max={MAX_ROWS}
            value={rowCount}
            onChange={(event) => {
              const value = Number(event.target.value);

              setRowCount(Number.isFinite(value) ? Math.min(MAX_ROWS, Math.max(MIN_ROWS, value)) : MIN_ROWS);
            }}
            disabled={isGenerating}
            className="mt-2 w-24 rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm outline-none focus:border-violet-500 disabled:opacity-60"
          />
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={!prompt.trim() || isGenerating}
          className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isGenerating ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
          {isGenerating ? "Generating..." : "Generate Dataset"}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
    </div>
  );
}

export default GenerateDataset;
