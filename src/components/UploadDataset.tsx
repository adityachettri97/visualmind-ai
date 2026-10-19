import { useRef, useState } from "react";
import Papa from "papaparse";
import { ArrowLeft, ArrowRight, Check, GripVertical, Pencil, Trash2, X } from "lucide-react";
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
  const {
    data,
    fileName,
    analysis,
    history,
    setDataset,
    setAIAnalysis,
    setAILoading,
    setAIError,
    renameDataset,
    renameColumn,
    reorderColumns,
    loadFromHistory,
    removeFromHistory,
  } = useDatasetStore();
  const [mode, setMode] = useState<"upload" | "create" | "generate">("upload");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isRenamingDataset, setIsRenamingDataset] = useState(false);
  const [datasetNameDraft, setDatasetNameDraft] = useState("");
  const [datasetRenameError, setDatasetRenameError] = useState<string | null>(null);
  const [renamingColumn, setRenamingColumn] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [renameError, setRenameError] = useState<string | null>(null);
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const modeToggleRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const previewScrollRef = useRef<HTMLDivElement>(null);

  useArrowKeyNav(modeToggleRef, { orientation: "horizontal" });
  useArrowKeyNav(historyRef, { orientation: "both" });
  const { showStartFade: previewShowStartFade, showEndFade: previewShowEndFade } = useScrollFade(previewScrollRef);
  function loadRows(rows: Record<string, string>[], name: string) {
    if (rows.length === 0 || Object.keys(rows[0]).length === 0) {
      setUploadError("The selected file does not contain a data table with rows and column headers.");
      return;
    }

    setUploadError(null);
    setDataset(rows, name, analyzeDataset(rows));
    setAILoading();

    analyzeWithAI(rows)
      .then((result) => {
        setAIAnalysis(result);
      })
      .catch((error) => {
        console.error("===== GROQ AI ERROR =====");
        console.error(error);

        setAIError(error instanceof Error ? error.message : "Failed to analyze dataset with AI.");
      });
  }

  function saveDatasetName() {
    const trimmedName = datasetNameDraft.trim();

    if (!trimmedName) {
      setDatasetRenameError("Dataset name cannot be blank.");
      return;
    }

    const currentExtension = fileName?.match(/\.[^.]+$/)?.[0] ?? "";
    const nextName = trimmedName.includes(".") || !currentExtension ? trimmedName : `${trimmedName}${currentExtension}`;
    renameDataset(nextName);
    setIsRenamingDataset(false);
    setDatasetRenameError(null);
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const input = event.currentTarget;

    if (!file) return;

    input.value = "";
    setUploadError(null);

    const extension = file.name.split(".").pop()?.toLowerCase();
    if (extension === "csv") {
      Papa.parse<Record<string, string>>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            setUploadError(`Could not parse CSV: ${results.errors[0].message}`);
            return;
          }

          loadRows(results.data, file.name);
        },
        error: (error) => {
          console.error("CSV parsing error:", error);
          setUploadError(`Could not parse CSV: ${error.message}`);
        },
      });
      return;
    }

    if (["xlsx", "xls", "xlsm", "xlsb"].includes(extension ?? "")) {
      try {
        const XLSX = await import("@e965/xlsx");
        const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
        const firstSheetName = workbook.SheetNames[0];

        if (!firstSheetName) {
          setUploadError("The Excel workbook does not contain any worksheets.");
          return;
        }

        const worksheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: "", raw: false }).map((row) =>
          Object.fromEntries(Object.entries(row).map(([column, value]) => [column, String(value)])),
        );

        loadRows(rows, file.name);
      } catch (error) {
        console.error("Excel parsing error:", error);
        setUploadError(error instanceof Error ? `Could not read Excel file: ${error.message}` : "Could not read Excel file.");
      }
      return;
    }

    setUploadError("Unsupported file type. Choose CSV or Excel (.xlsx/.xls/.xlsm/.xlsb).");
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

          <p className="mt-2 text-sm text-slate-400">
            Upload a CSV or Excel spreadsheet to create a dataset.
          </p>

          {/* Upload Area */}
          <label className="mt-6 flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-600 p-6 sm:p-8 transition hover:border-violet-400">
            <div className="text-center">
              <p className="font-medium">Click to upload a file</p>

              <p className="mt-1 text-sm text-slate-500">CSV or Excel (.xlsx/.xls/.xlsm/.xlsb)</p>
            </div>

            <input
              type="file"
              accept=".csv,.xlsx,.xls,.xlsm,.xlsb"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          {uploadError && <p role="alert" className="mt-3 text-sm text-red-400">{uploadError}</p>}
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
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <p className="text-sm text-slate-400">Dataset name</p>
              {isRenamingDataset ? (
                <input
                  autoFocus
                  aria-label="Dataset name"
                  value={datasetNameDraft}
                  onChange={(event) => setDatasetNameDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") saveDatasetName();
                    if (event.key === "Escape") setIsRenamingDataset(false);
                  }}
                  className="mt-1 rounded border border-violet-500 bg-slate-950 px-2 py-1 font-medium text-white outline-none"
                />
              ) : (
                <p className="font-medium">{fileName}</p>
              )}
            </div>
            {isRenamingDataset ? (
              <>
                <button type="button" onClick={saveDatasetName} aria-label="Save dataset name" className="text-emerald-400 hover:text-emerald-300">
                  <Check size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsRenamingDataset(false);
                    setDatasetRenameError(null);
                  }}
                  aria-label="Cancel dataset rename"
                  className="text-slate-500 hover:text-white"
                >
                  <X size={16} />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setDatasetNameDraft(fileName);
                  setIsRenamingDataset(true);
                  setDatasetRenameError(null);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-300 transition hover:border-violet-500 hover:text-white"
              >
                <Pencil size={14} />
                Rename dataset
              </button>
            )}
          </div>
          {datasetRenameError && <p role="alert" className="mt-2 text-sm text-red-400">{datasetRenameError}</p>}
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
                  {Object.keys(data[0]).map((column, columnIndex, columns) => (
                    <th
                      key={column}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        event.preventDefault();
                        const sourceColumn = event.dataTransfer.getData("text/plain") || draggedColumn;

                        if (sourceColumn) reorderColumns(sourceColumn, column);
                        setDraggedColumn(null);
                      }}
                      className={`px-4 py-3 text-left font-semibold text-slate-300 ${draggedColumn === column ? "opacity-50" : ""}`}
                    >
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          draggable
                          onDragStart={(event) => {
                            event.dataTransfer.setData("text/plain", column);
                            event.dataTransfer.effectAllowed = "move";
                            setDraggedColumn(column);
                          }}
                          onDragEnd={() => setDraggedColumn(null)}
                          aria-label={`Drag to move column ${column}`}
                          title="Drag to reorder column"
                          className="cursor-grab text-slate-500 hover:text-violet-300 active:cursor-grabbing"
                        >
                          <GripVertical size={14} />
                        </button>
                        <span className="flex shrink-0 items-center gap-0.5 sm:hidden">
                          <button
                            type="button"
                            onClick={() => {
                              const previousColumn = columns[columnIndex - 1];
                              if (previousColumn) reorderColumns(column, previousColumn);
                            }}
                            disabled={columnIndex === 0}
                            aria-label={`Move column ${column} left`}
                            className="rounded p-1 text-slate-400 transition hover:bg-violet-500/15 hover:text-violet-300 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <ArrowLeft size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const nextColumn = columns[columnIndex + 1];
                              if (nextColumn) reorderColumns(column, nextColumn);
                            }}
                            disabled={columnIndex === columns.length - 1}
                            aria-label={`Move column ${column} right`}
                            className="rounded p-1 text-slate-400 transition hover:bg-violet-500/15 hover:text-violet-300 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <ArrowRight size={14} />
                          </button>
                        </span>
                        {renamingColumn === column ? (
                          <>
                            <input
                              autoFocus
                              aria-label={`Rename column ${column}`}
                              value={renameDraft}
                              onChange={(event) => setRenameDraft(event.target.value)}
                              onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                  const nextName = renameDraft.trim();
                                  if (!nextName) {
                                    setRenameError("Column name cannot be blank.");
                                  } else if (nextName !== column && Object.keys(data[0]).includes(nextName)) {
                                    setRenameError(`A column named "${nextName}" already exists.`);
                                  } else {
                                    renameColumn(column, nextName);
                                    setRenamingColumn(null);
                                    setRenameError(null);
                                  }
                                }
                                if (event.key === "Escape") {
                                  setRenamingColumn(null);
                                  setRenameError(null);
                                }
                              }}
                              className="w-32 rounded border border-violet-500 bg-slate-950 px-2 py-1 text-sm font-normal text-white outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const nextName = renameDraft.trim();
                                if (!nextName) {
                                  setRenameError("Column name cannot be blank.");
                                } else if (nextName !== column && Object.keys(data[0]).includes(nextName)) {
                                  setRenameError(`A column named "${nextName}" already exists.`);
                                } else {
                                  renameColumn(column, nextName);
                                  setRenamingColumn(null);
                                  setRenameError(null);
                                }
                              }}
                              aria-label={`Save column name ${renameDraft}`}
                              className="text-emerald-400 hover:text-emerald-300"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRenamingColumn(null);
                                setRenameError(null);
                              }}
                              aria-label="Cancel column rename"
                              className="text-slate-500 hover:text-white"
                            >
                              <X size={14} />
                            </button>
                          </>
                        ) : (
                          <>
                            <span>{column}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setRenamingColumn(column);
                                setRenameDraft(column);
                                setRenameError(null);
                              }}
                              aria-label={`Rename column ${column}`}
                              title={`Rename ${column}`}
                              className="text-slate-500 hover:text-violet-300"
                            >
                              <Pencil size={12} />
                            </button>
                          </>
                        )}
                      </div>
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

          {renameError && <p role="alert" className="mt-2 text-sm text-red-400">{renameError}</p>}
          <p className="mt-2 text-xs text-slate-500">Drag a column by its grip, or use the arrows on mobile to change its position. Rename columns with the pencil icon.</p>

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
