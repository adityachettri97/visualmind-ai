import { useRef, useState } from "react";
import Papa from "papaparse";
import { Trash2 } from "lucide-react";
import { analyzeDataset } from "../utils/analyzeDataset";
import { useDatasetStore } from "../store/datasetStore";
import { analyzeWithAI } from "../services/aiService";
import ManualEntry from "./ManualEntry/ManualEntry";
import GenerateDataset from "./ManualEntry/GenerateDataset";
import { useArrowKeyNav } from "../hooks/useArrowKeyNav";
import { useScrollFade } from "../hooks/useScrollFade";

function formatRelativeTime(timestamp: number): string {
  const diffMinutes = Math.floor((Date.now() - timestamp) / 60000);

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);

  return `${diffDays}d ago`;
}

function UploadDataset() {
  const { data, fileName, analysis, history, setDataset, setAIAnalysis, setAILoading, setAIError, loadFromHistory, removeFromHistory } =
    useDatasetStore();
  const [mode, setMode] = useState<"upload" | "create" | "generate">("upload");
  const modeToggleRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const previewScrollRef = useRef<HTMLDivElement>(null);

  useArrowKeyNav(modeToggleRef, { orientation: "horizontal" });
  useArrowKeyNav(historyRef, { orientation: "both" });
  const { showStartFade: previewShowStartFade, showEndFade: previewShowEndFade } = useScrollFade(previewScrollRef);
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,

      complete: (results) => {
        const analysis = analyzeDataset(results.data);

        setDataset(results.data, file.name, analysis);
        setAILoading();

        analyzeWithAI(results.data)
          .then((result) => {
            setAIAnalysis(result);
          })
          .catch((error) => {
            console.error("===== GROQ AI ERROR =====");
            console.error(error);

            setAIError(error instanceof Error ? error.message : "Failed to analyze dataset with AI.");
          });
      },

      error: (error) => {
        console.error("CSV parsing error:", error);
      },
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Mode toggle */}
      <div ref={modeToggleRef} className="flex w-full gap-1 rounded-xl border border-slate-700 bg-slate-900/40 p-1 sm:w-fit">
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-medium whitespace-nowrap transition sm:flex-none sm:px-3 sm:text-sm ${
            mode === "upload" ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          Upload File
        </button>

        <button
          type="button"
          onClick={() => setMode("create")}
          className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-medium whitespace-nowrap transition sm:flex-none sm:px-3 sm:text-sm ${
            mode === "create" ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          Create Manually
        </button>

        <button
          type="button"
          onClick={() => setMode("generate")}
          className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-medium whitespace-nowrap transition sm:flex-none sm:px-3 sm:text-sm ${
            mode === "generate" ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          Generate with AI
        </button>
      </div>

      {mode === "upload" ? (
        <div className="glass rounded-2xl p-4 sm:p-6">
          <h2 className="text-xl font-semibold">Upload Dataset</h2>

          <p className="mt-2 text-sm text-slate-400">Upload a CSV file to analyze your data.</p>

          {/* Upload Area */}
          <label className="mt-6 flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-600 p-6 sm:p-8 transition hover:border-violet-400">
            <div className="text-center">
              <p className="font-medium">Click to upload CSV</p>

              <p className="mt-1 text-sm text-slate-500">CSV files only</p>
            </div>

            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      ) : mode === "create" ? (
        <ManualEntry />
      ) : (
        <GenerateDataset />
      )}

      {/* Recent Datasets */}
      {history.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-3 text-lg font-semibold">Recent Datasets</h3>

          <div ref={historyRef} className="space-y-2">
            {history.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-700 bg-slate-900/40 p-4"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{entry.fileName}</p>

                  <p className="text-xs text-slate-500">
                    {entry.analysis.rowCount.toLocaleString()} rows • {entry.analysis.columnCount} columns •{" "}
                    {formatRelativeTime(entry.uploadedAt)}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => loadFromHistory(entry.id)}
                    className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium hover:bg-violet-700 transition"
                  >
                    Load
                  </button>

                  <button
                    onClick={() => removeFromHistory(entry.id)}
                    aria-label={`Remove ${entry.fileName} from history`}
                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected File */}
      {fileName && (
        <div className="mt-4">
          <p className="text-sm text-slate-400">Selected file:</p>

          <p className="font-medium">{fileName}</p>
        </div>
      )}

      {/* Success Message */}
      {data.length > 0 && <p className="mt-4 text-sm text-emerald-400">Successfully loaded {data.length} rows.</p>}

      {/* Data Preview */}
      {data.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-3 text-lg font-semibold">Data Preview</h3>

          <div className="relative">
          <div ref={previewScrollRef} className="glass-scrollbar max-h-80 overflow-auto rounded-xl border border-slate-700">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/60">
                <tr>
                  {Object.keys(data[0]).map((column) => (
                    <th key={column} className="px-4 py-3 text-left font-semibold text-slate-300">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {data.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-t border-slate-700 hover:bg-slate-800/40">
                    {Object.keys(data[0]).map((column) => (
                      <td key={column} className="px-4 py-3 text-slate-300">
                        {row[column]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

            {/* Hints that the table scrolls — there's no visible scrollbar on touch devices to
                make the overflow obvious otherwise. */}
            {previewShowStartFade && (
              <div className="pointer-events-none absolute inset-y-0 left-0 w-8 rounded-l-xl bg-linear-to-r from-slate-900/90 to-transparent" />
            )}
            {previewShowEndFade && (
              <div className="pointer-events-none absolute inset-y-0 right-0 w-8 rounded-r-xl bg-linear-to-l from-slate-900/90 to-transparent" />
            )}
          </div>

          {data.length > 10 && <p className="mt-2 text-xs text-slate-500">Showing first 10 rows of {data.length}.</p>}
        </div>
      )}
      {analysis && (
        <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-900/40 p-5">
          <h3 className="text-lg font-semibold">Dataset Analysis</h3>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-slate-800/50 p-4">
              <p className="text-sm text-slate-400">Rows</p>

              <p className="mt-1 text-2xl font-bold">{analysis.rowCount}</p>
            </div>

            <div className="rounded-xl bg-slate-800/50 p-4">
              <p className="text-sm text-slate-400">Columns</p>

              <p className="mt-1 text-2xl font-bold">{analysis.columnCount}</p>
            </div>
          </div>

          <div className="mt-5">
            <p className="text-sm text-slate-400">Numeric Columns</p>

            <div className="mt-2 flex flex-wrap gap-2">
              {analysis.numericColumns.map((column) => (
                <span key={column} className="rounded-lg bg-violet-500/15 px-3 py-1 text-sm text-violet-300">
                  {column}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <p className="text-sm text-slate-400">Text Columns</p>

            <div className="mt-2 flex flex-wrap gap-2">
              {analysis.textColumns.map((column) => (
                <span key={column} className="rounded-lg bg-slate-700/50 px-3 py-1 text-sm text-slate-300">
                  {column}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UploadDataset;
