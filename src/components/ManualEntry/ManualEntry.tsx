import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Calculator, Check, FilePlus2, GripVertical, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { useDatasetStore } from "../../store/datasetStore";
import { analyzeDataset } from "../../utils/analyzeDataset";
import { analyzeWithAI } from "../../services/aiService";
import { useScrollFade } from "../../hooks/useScrollFade";
import { useThemeStore } from "../../store/themeStore";
import {
  compileCalculatedFormula,
  formulaReferencesColumn,
  recalculateCalculatedColumns,
  type CalculatedColumns,
} from "../../utils/calculatedColumns";

type ColumnType = "text" | "number" | "date";

interface ColumnDef {
  name: string;
  type: ColumnType;
  formula?: string;
}

const CALCULATED_COLUMN_EXAMPLES = [
  {
    name: "Profit per item",
    formula: "[Selling Price] - [Unit Cost]",
    description: "Money received for one item minus what you paid to make or buy it.",
    columns: [
      { key: "Selling Price", help: "The amount charged or received for one item." },
      { key: "Unit Cost", help: "What it costs your business to make or buy one item." },
    ],
  },
  {
    name: "Total profit",
    formula: "([Selling Price] - [Unit Cost]) * [Quantity]",
    description: "Profit per item multiplied by the number of items sold.",
    columns: [
      { key: "Selling Price", help: "The amount charged or received per item." },
      { key: "Unit Cost", help: "What it costs to make or buy one item." },
      { key: "Quantity", help: "The number of items sold." },
    ],
  },
  {
    name: "Loss per item",
    formula: "[Unit Cost] - [Selling Price]",
    description: "Positive when an item costs more than it sells for; negative means the item made a profit.",
    columns: [
      { key: "Unit Cost", help: "What it costs your business to make or buy one item." },
      { key: "Selling Price", help: "The amount charged or received for one item." },
    ],
  },
  {
    name: "Discount amount",
    formula: "[Original Price] * [Discount Rate] / 100",
    description: "The money taken off the original price. Enter a 15% discount as 15.",
    columns: [
      { key: "Original Price", help: "The price before the discount." },
      { key: "Discount Rate", help: "The discount percentage, entered as a number such as 15." },
    ],
  },
  {
    name: "Price after discount",
    formula: "[Original Price] * (1 - [Discount Rate] / 100)",
    description: "The amount the customer pays after the percentage discount.",
    columns: [
      { key: "Original Price", help: "The price before the discount." },
      { key: "Discount Rate", help: "The discount percentage, entered as a number such as 15." },
    ],
  },
  {
    name: "Sales revenue",
    formula: "[Selling Price] * [Quantity]",
    description: "Money received per item multiplied by the number of items sold.",
    columns: [
      { key: "Selling Price", help: "The amount charged or received per item." },
      { key: "Quantity", help: "The number of items sold." },
    ],
  },
  {
    name: "Total cost",
    formula: "[Unit Cost] * [Quantity]",
    description: "Cost to make or buy one item multiplied by the number of items.",
    columns: [
      { key: "Unit Cost", help: "What it costs to make or buy one item." },
      { key: "Quantity", help: "The number of items." },
    ],
  },
  {
    name: "Simple interest",
    formula: "[Principal] * [Rate] * [Time] / 100",
    description: "Interest earned or owed. Enter rate as a percentage (5 for 5%) and time in years.",
    columns: [
      { key: "Principal", help: "The original amount borrowed or invested." },
      { key: "Rate", help: "Annual interest rate as a number, such as 5 for 5%." },
      { key: "Time", help: "Time in years." },
    ],
  },
  {
    name: "Amount with simple interest",
    formula: "[Principal] + ([Principal] * [Rate] * [Time] / 100)",
    description: "Original amount plus simple interest. Rate is a percentage and time is in years.",
    columns: [
      { key: "Principal", help: "The original amount borrowed or invested." },
      { key: "Rate", help: "Annual interest rate as a number, such as 5 for 5%." },
      { key: "Time", help: "Time in years." },
    ],
  },
];

function CalculatedColumnHelp({
  availableColumns,
  onUseExample,
}: {
  availableColumns: string[];
  onUseExample: (name: string, formula: string) => void;
}) {
  const [selectedExample, setSelectedExample] = useState<(typeof CALCULATED_COLUMN_EXAMPLES)[number] | null>(null);
  const [columnSelections, setColumnSelections] = useState<Record<string, string>>({});
  const isLightTheme = useThemeStore((state) => state.theme === "light");
  const missingColumnSelection = selectedExample?.columns.some((column) => !columnSelections[column.key]) ?? false;

  return (
    <details className="w-full rounded-lg border border-slate-700 bg-slate-900/30 p-3">
      <summary className="cursor-pointer text-sm font-medium text-violet-300">
        How to use calculated columns
      </summary>
      <div className="mt-3 space-y-3 text-xs leading-5 text-slate-400">
        <p>
          A calculated column works on each row. For example, profit is usually money received from
          selling an item minus what it cost your business to make or buy that item. Your column
          headers may use different words, so choose which of your columns means each value.
        </p>
        <p>
          To write your own formula, use numeric columns in square brackets, such as{" "}
          <code className="text-slate-200">[Revenue] - [Cost]</code>.
          Use <code className="text-slate-200">+</code>, <code className="text-slate-200">-</code>,
          <code className="text-slate-200"> *</code>, <code className="text-slate-200"> / </code>,
          <code className="text-slate-200"> % </code>, <code className="text-slate-200"> ^ </code>,
          and parentheses. Choose an example below, match each meaning to a column in your dataset,
          then use the generated formula.
        </p>
        <p>
          Calculations need numeric values. If your dataset has a total cost or total sales column,
          select that instead of a per-item amount; select Quantity only when the example asks for it.
          Calculated values update when source values change. Missing or non-numeric inputs produce a blank.
        </p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {CALCULATED_COLUMN_EXAMPLES.map((example) => (
            <li key={example.name}>
              <button
                type="button"
                aria-pressed={selectedExample?.name === example.name}
                onClick={() => {
                  setSelectedExample(example);
                  setColumnSelections({});
                  onUseExample(example.name, example.formula);
                }}
                className={`w-full rounded-md border px-2.5 py-2 text-left transition ${
                  selectedExample?.name === example.name
                    ? "border-violet-500 bg-violet-500/10"
                    : "border-slate-700 hover:border-violet-500 hover:bg-violet-500/10"
                }`}
              >
                <span className={`block font-semibold ${isLightTheme ? "text-black" : "text-slate-200"}`}>{example.name}</span>
                <span className={`mt-0.5 block ${isLightTheme ? "text-slate-700" : "text-slate-400"}`}>{example.description}</span>
              </button>
            </li>
          ))}
        </ul>
        {selectedExample && (
          <div className="space-y-3 rounded-lg border border-slate-700 p-3">
            <h4 className={`font-semibold ${isLightTheme ? "text-black" : "text-slate-200"}`}>Match “{selectedExample.name}” to your columns</h4>
            {availableColumns.length > 0 ? (
              selectedExample.columns.map((column) => (
                <label key={column.key} className="block">
                  <span className={`mb-1 block ${isLightTheme ? "text-black" : "text-slate-300"}`}>
                    <span className="font-medium">{column.key}:</span> {column.help}
                  </span>
                  <select
                    value={columnSelections[column.key] ?? ""}
                    onChange={(event) =>
                      setColumnSelections((selections) => ({ ...selections, [column.key]: event.target.value }))
                    }
                    className={`w-full rounded-md border px-2.5 py-2 text-sm outline-none focus:border-violet-500 ${
                      isLightTheme
                        ? "border-slate-400 bg-white text-black"
                        : "border-slate-600 bg-slate-950 text-slate-100"
                    }`}
                  >
                    <option value="">Choose a column...</option>
                    {availableColumns.map((columnName) => (
                      <option key={columnName} value={columnName}>{columnName}</option>
                    ))}
                  </select>
                </label>
              ))
            ) : (
              <p>Add the source columns to your table first, then choose this example again.</p>
            )}
            <div>
              <span className={`block ${isLightTheme ? "text-slate-700" : "text-slate-400"}`}>Formula preview</span>
              <code className={`mt-1 block break-words ${isLightTheme ? "text-black" : "text-violet-300"}`}>
                {selectedExample.formula.replace(/\[([^\]]+)\]/g, (_match, key: string) =>
                  columnSelections[key] ? `[${columnSelections[key]}]` : `[Choose ${key}]`,
                )}
              </code>
            </div>
            <button
              type="button"
              disabled={availableColumns.length === 0 || missingColumnSelection}
              onClick={() => {
                const formula = selectedExample.formula.replace(/\[([^\]]+)\]/g, (_match, key: string) => `[${columnSelections[key]}]`);
                onUseExample(selectedExample.name, formula);
              }}
              className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Use this formula
            </button>
          </div>
        )}
      </div>
    </details>
  );
}

const TYPE_LABELS: Record<ColumnType, string> = {
  text: "Text",
  number: "Number",
  date: "Date",
};

function ManualEntry() {
  const {
    data,
    fileName,
    analysis,
    calculatedColumns,
    setDataset,
    renameDataset,
    appendRows,
    updateCell,
    deleteRow,
    addColumn: addColumnToDataset,
    renameColumn: renameColumnInDataset,
    reorderColumns,
    addCalculatedColumn: addCalculatedColumnToDataset,
    deleteColumn: deleteColumnFromDataset,
    setAILoading,
    setAIAnalysis,
    setAIError,
  } = useDatasetStore();
  const hasDataset = data.length > 0 && analysis !== null;

  // Lets the user reach the from-scratch table builder even while a dataset is already active —
  // without this, there'd be no way back to "start new" once any dataset (uploaded, generated,
  // or manually created) exists, since hasDataset alone would always route to the append form.
  const [forceNewTable, setForceNewTable] = useState(false);
  const showBuilder = !hasDataset || forceNewTable;

  // Table-builder state — only relevant while the builder is showing.
  const [datasetName, setDatasetName] = useState("");
  const [columnDefs, setColumnDefs] = useState<ColumnDef[]>([]);
  const [newColumnName, setNewColumnName] = useState("");
  const [newColumnType, setNewColumnType] = useState<ColumnType>("text");
  const [newCalculatedColumnName, setNewCalculatedColumnName] = useState("");
  const [newCalculatedFormula, setNewCalculatedFormula] = useState("");
  const [calculatedColumnError, setCalculatedColumnError] = useState<string | null>(null);
  const [pendingRows, setPendingRows] = useState<Record<string, string>[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Editing state — used once a dataset is already active.
  const [editColumnName, setEditColumnName] = useState("");
  const [isRenamingDataset, setIsRenamingDataset] = useState(false);
  const [datasetNameDraft, setDatasetNameDraft] = useState("");
  const [renamingColumn, setRenamingColumn] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [columnRenameError, setColumnRenameError] = useState<string | null>(null);
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);

  // Shared by both tables below (only one is ever mounted at a time) — lets arrow keys move
  // between cells like a spreadsheet, via each cell's data-row/data-col attributes.
  const tableRef = useRef<HTMLTableElement>(null);
  // The table's scrolling wrapper (not the <table> itself) — tracked separately so a fade hint
  // can show whenever there's more of the table hidden off-screen, since on mobile there's no
  // visible scrollbar to make that obvious otherwise.
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { showStartFade, showEndFade } = useScrollFade(scrollContainerRef);

  function handleCellArrowNav(event: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, colIndex: number) {
    const { key } = event;

    if (key !== "ArrowUp" && key !== "ArrowDown" && key !== "ArrowLeft" && key !== "ArrowRight") return;

    // Left/Right only jump cells once the caret is already at that edge of the text — otherwise
    // they move the caret within the field like normal. Up/Down always jump, since a single-line
    // input has no "within text" vertical movement to preserve.
    const input = event.currentTarget;

    if (key === "ArrowLeft" && input.selectionStart !== 0) return;
    if (key === "ArrowRight" && input.selectionEnd !== input.value.length) return;

    let targetRow = rowIndex;
    let targetCol = colIndex;

    if (key === "ArrowUp") targetRow -= 1;
    else if (key === "ArrowDown") targetRow += 1;
    else if (key === "ArrowLeft") targetCol -= 1;
    else targetCol += 1;

    const target = tableRef.current?.querySelector<HTMLInputElement>(`[data-row="${targetRow}"][data-col="${targetCol}"]`);

    if (target) {
      event.preventDefault();
      target.focus();
      target.select();
    }
  }

  function addColumn() {
    const name = newColumnName.trim();

    if (!name || columnDefs.some((column) => column.name === name)) return;

    setColumnDefs((columns) => [...columns, { name, type: newColumnType }]);
    setNewColumnName("");
    setNewColumnType("text");

    if (pendingRows.length === 0) setPendingRows([{}]);
    setSaveError(null);
  }

  function removeColumn(name: string) {
    setColumnDefs((columns) => {
      const removed = new Set([name]);
      let changed = true;

      while (changed) {
        changed = false;
        columns.forEach((column) => {
          if (
            column.formula &&
            !removed.has(column.name) &&
            Array.from(removed).some((removedName) => formulaReferencesColumn(column.formula!, removedName))
          ) {
            removed.add(column.name);
            changed = true;
          }
        });
      }

      return columns.filter((column) => !removed.has(column.name));
    });
  }

  function addPendingRow() {
    setPendingRows((rows) => [...rows, {}]);
  }

  function removePendingRow(rowIndex: number) {
    setPendingRows((rows) => rows.filter((_, index) => index !== rowIndex));
  }

  function updatePendingCell(rowIndex: number, columnName: string, value: string) {
    const formulas = Object.fromEntries(
      columnDefs.filter((column) => column.formula).map((column) => [column.name, column.formula!]),
    ) as CalculatedColumns;
    setPendingRows((rows) =>
      recalculateCalculatedColumns(
        rows.map((row, index) => (index === rowIndex ? { ...row, [columnName]: value } : row)),
        formulas,
      ),
    );
    setSaveError(null);
  }

  function handleAddCalculatedColumn() {
    const name = newCalculatedColumnName.trim();
    const formula = newCalculatedFormula.trim();
    const columnNames = showBuilder ? columnDefs.map((column) => column.name) : (analysis?.columns ?? []);

    if (!name || !formula) {
      setCalculatedColumnError("Enter a column name and formula.");
      return;
    }

    if (columnNames.includes(name)) {
      setCalculatedColumnError(`A column named "${name}" already exists.`);
      return;
    }

    try {
      compileCalculatedFormula(formula, columnNames);

      if (showBuilder) {
        setColumnDefs((columns) => [...columns, { name, type: "number", formula }]);
        setPendingRows((rows) =>
          recalculateCalculatedColumns(rows.length > 0 ? rows : [{}], {
            ...Object.fromEntries(columnDefs.filter((column) => column.formula).map((column) => [column.name, column.formula!])),
            [name]: formula,
          }),
        );
      } else {
        addCalculatedColumnToDataset(name, formula);
      }

      setNewCalculatedColumnName("");
      setNewCalculatedFormula("");
      setCalculatedColumnError(null);
    } catch (error) {
      setCalculatedColumnError(error instanceof Error ? error.message : "Formula is invalid.");
    }
  }

  function useCalculatedColumnExample(name: string, formula: string) {
    setNewCalculatedColumnName(name);
    setNewCalculatedFormula(formula);
    setCalculatedColumnError(null);
  }

  function handleSaveTable() {
    if (columnDefs.length === 0) {
      setSaveError("Add at least one column first.");
      return;
    }

    const rows = pendingRows
      .map((row) => {
        const clean: Record<string, string> = {};

        columnDefs.forEach((column) => {
          clean[column.name] = (row[column.name] ?? "").trim();
        });

        return clean;
      })
      .filter((row) => Object.values(row).some((value) => value !== ""));

    if (rows.length === 0) {
      setSaveError("Fill in at least one row before saving.");
      return;
    }

    const trimmedName = datasetName.trim() || "My Dataset";
    const newFileName = trimmedName.toLowerCase().endsWith(".csv") ? trimmedName : `${trimmedName}.csv`;

    const formulas = Object.fromEntries(
      columnDefs.filter((column) => column.formula).map((column) => [column.name, column.formula!]),
    ) as CalculatedColumns;
    const calculatedRows = recalculateCalculatedColumns(rows, formulas);
    setDataset(calculatedRows, newFileName, analyzeDataset(calculatedRows), formulas);
    setAILoading();

    analyzeWithAI(calculatedRows)
      .then((result) => setAIAnalysis(result))
      .catch((error) => {
        setAIError(error instanceof Error ? error.message : "Failed to analyze dataset with AI.");
      });

    setDatasetName("");
    setColumnDefs([]);
    setPendingRows([]);
    setNewCalculatedColumnName("");
    setNewCalculatedFormula("");
    setSaveError(null);
    // The dataset that was just saved becomes the active one — drop back to the append view for it.
    setForceNewTable(false);
  }

  function inputTypeFor(column: string): "text" | "number" {
    return analysis?.numericColumns.includes(column) ? "number" : "text";
  }

  function handleAddColumnToDataset() {
    const name = editColumnName.trim();

    if (!name) return;

    addColumnToDataset(name);
    setEditColumnName("");
  }

  function beginRenameColumn(column: string) {
    setRenamingColumn(column);
    setRenameDraft(column);
    setColumnRenameError(null);
  }

  function saveColumnRename() {
    if (!renamingColumn) return;

    const trimmedName = renameDraft.trim();

    if (!trimmedName) {
      setColumnRenameError("Column name cannot be blank.");
      return;
    }

    if (trimmedName !== renamingColumn && analysis?.columns.includes(trimmedName)) {
      setColumnRenameError(`A column named "${trimmedName}" already exists.`);
      return;
    }

    renameColumnInDataset(renamingColumn, trimmedName);
    setRenamingColumn(null);
    setRenameDraft("");
    setColumnRenameError(null);
  }

  function saveDatasetRename() {
    const trimmedName = datasetNameDraft.trim();

    if (!trimmedName) return;

    const currentExtension = fileName?.match(/\.[^.]+$/)?.[0] ?? "";
    const nextName = trimmedName.includes(".") || !currentExtension ? trimmedName : `${trimmedName}${currentExtension}`;
    renameDataset(nextName);
    setIsRenamingDataset(false);
  }

  if (!showBuilder) {
    return (
      <div className="glass rounded-2xl p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Create Dataset</h2>

            <p className="mt-2 text-sm text-slate-400">
              {isRenamingDataset ? (
                <span className="inline-flex flex-wrap items-center gap-2">
                  <input
                    autoFocus
                    aria-label="Dataset name"
                    value={datasetNameDraft}
                    onChange={(event) => setDatasetNameDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") saveDatasetRename();
                      if (event.key === "Escape") setIsRenamingDataset(false);
                    }}
                    className="rounded border border-violet-500 bg-slate-950 px-2 py-1 text-sm text-white outline-none"
                  />
                  <button type="button" onClick={saveDatasetRename} aria-label="Save dataset name" className="text-emerald-400 hover:text-emerald-300">
                    <Check size={15} />
                  </button>
                  <button type="button" onClick={() => setIsRenamingDataset(false)} aria-label="Cancel dataset rename" className="text-slate-500 hover:text-white">
                    <X size={15} />
                  </button>
                </span>
              ) : (
                <span className="inline-flex flex-wrap items-center gap-2">
                  Editing &quot;{fileName}&quot; — edit any cell, add or remove columns and rows. Changes save instantly.
                  <button
                    type="button"
                    onClick={() => {
                      setDatasetNameDraft(fileName ?? "");
                      setIsRenamingDataset(true);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-2.5 py-1 text-xs font-medium text-slate-300 transition hover:border-violet-500 hover:text-white"
                  >
                    <Pencil size={14} />
                    Rename dataset
                  </button>
                </span>
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setForceNewTable(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-300 transition hover:border-violet-500 hover:text-white"
          >
            <FilePlus2 size={15} />
            Start a New Table
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <input
            type="text"
            value={editColumnName}
            onChange={(event) => setEditColumnName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleAddColumnToDataset();
              }
            }}
            placeholder="New column name"
            className="max-w-xs flex-1 rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm outline-none focus:border-violet-500"
          />

          <button
            type="button"
            onClick={handleAddColumnToDataset}
            className="flex items-center gap-1 rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium transition hover:bg-violet-700"
          >
            <Plus size={15} />
            Add Column
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-2">
          <div className="min-w-40 flex-1">
            <label htmlFor="active-calculated-column-name" className="text-xs font-medium text-slate-400">
              Calculated column
            </label>
            <input
              id="active-calculated-column-name"
              type="text"
              value={newCalculatedColumnName}
              onChange={(event) => setNewCalculatedColumnName(event.target.value)}
              placeholder="e.g. Profit"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm outline-none focus:border-violet-500"
            />
          </div>
          <div className="min-w-52 flex-[2]">
            <label htmlFor="active-calculated-column-formula" className="text-xs font-medium text-slate-400">
              Formula
            </label>
            <input
              id="active-calculated-column-formula"
              type="text"
              value={newCalculatedFormula}
              onChange={(event) => setNewCalculatedFormula(event.target.value)}
              placeholder="[Revenue] - [Cost]"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm outline-none focus:border-violet-500"
            />
          </div>
          <button
            type="button"
            onClick={handleAddCalculatedColumn}
            className="flex items-center gap-1 rounded-lg border border-violet-500/50 px-3 py-2 text-sm font-medium text-violet-200 transition hover:bg-violet-500/10"
          >
            <Calculator size={15} />
            Add Formula
          </button>
          {calculatedColumnError && (
            <p role="alert" className="w-full text-sm text-red-400">
              {calculatedColumnError}
            </p>
          )}
          <p className="w-full text-xs text-slate-500">Use column names in brackets and +, -, *, /, %, ^, and parentheses.</p>
          <CalculatedColumnHelp availableColumns={analysis?.columns ?? []} onUseExample={useCalculatedColumnExample} />
        </div>

        <div className="relative mt-4">
          <div ref={scrollContainerRef} className="glass-scrollbar overflow-auto rounded-xl border border-slate-700">
            <table ref={tableRef} className="w-full text-sm">
              <thead className="bg-slate-800/60">
                <tr>
                  {analysis.columns.map((column, columnIndex) => (
                    <th
                      key={column}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        event.preventDefault();
                        const sourceColumn = event.dataTransfer.getData("text/plain") || draggedColumn;

                        if (sourceColumn) reorderColumns(sourceColumn, column);
                        setDraggedColumn(null);
                      }}
                      className={`px-3 py-2 text-left font-semibold text-slate-300 ${draggedColumn === column ? "opacity-50" : ""}`}
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
                              const previousColumn = analysis.columns[columnIndex - 1];
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
                              const nextColumn = analysis.columns[columnIndex + 1];
                              if (nextColumn) reorderColumns(column, nextColumn);
                            }}
                            disabled={columnIndex === analysis.columns.length - 1}
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
                                if (event.key === "Enter") saveColumnRename();
                                if (event.key === "Escape") {
                                  setRenamingColumn(null);
                                  setColumnRenameError(null);
                                }
                              }}
                              className="w-32 rounded border border-violet-500 bg-slate-950 px-2 py-1 text-sm font-normal text-white outline-none"
                            />
                            <button type="button" onClick={saveColumnRename} aria-label={`Save column name ${renameDraft}`} className="text-emerald-400 hover:text-emerald-300">
                              <Check size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRenamingColumn(null);
                                setColumnRenameError(null);
                              }}
                              aria-label="Cancel column rename"
                              className="text-slate-500 hover:text-white"
                            >
                              <X size={14} />
                            </button>
                          </>
                        ) : (
                          <>
                            <span title={calculatedColumns[column] ? `Formula: ${calculatedColumns[column]}` : undefined}>{column}</span>
                            {calculatedColumns[column] && <span className="text-[10px] text-violet-300">ƒx</span>}
                            <button
                              type="button"
                              onClick={() => beginRenameColumn(column)}
                              aria-label={`Rename column ${column}`}
                              title={`Rename ${column}`}
                              className="text-slate-500 hover:text-violet-300"
                            >
                              <Pencil size={12} />
                            </button>
                          </>
                        )}

                        <button
                          type="button"
                          onClick={() => deleteColumnFromDataset(column)}
                          disabled={analysis.columns.length <= 1}
                          aria-label={`Remove column ${column}`}
                          className="ml-auto text-slate-500 hover:text-red-400 disabled:pointer-events-none disabled:opacity-30"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </th>
                  ))}

                  <th className="w-10" />
                </tr>
              </thead>

              <tbody>
                {data.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-t border-slate-700">
                    {analysis.columns.map((column, colIndex) => (
                      <td key={column} className="px-3 py-2">
                        <input
                          type={inputTypeFor(column)}
                          value={row[column] ?? ""}
                          onChange={(event) => updateCell(rowIndex, column, event.target.value)}
                          onKeyDown={(event) => handleCellArrowNav(event, rowIndex, colIndex)}
                          readOnly={Boolean(calculatedColumns[column])}
                          title={calculatedColumns[column] ? `Calculated from ${calculatedColumns[column]}` : undefined}
                          data-row={rowIndex}
                          data-col={colIndex}
                          className={`w-full min-w-[8rem] rounded-md border border-transparent px-2 py-1.5 text-sm outline-none focus:border-violet-500 ${calculatedColumns[column] ? "bg-violet-950/30 text-violet-100" : "bg-slate-950/40"}`}
                        />
                      </td>
                    ))}

                    <td className="px-2 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => deleteRow(rowIndex)}
                        aria-label={`Remove row ${rowIndex + 1}`}
                        className="text-slate-500 hover:text-red-400"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Hints that the table scrolls — there's no visible scrollbar on touch devices to
              make the overflow obvious otherwise. */}
          {showStartFade && (
            <div className="pointer-events-none absolute inset-y-0 left-0 w-8 rounded-l-xl bg-linear-to-r from-slate-900/90 to-transparent" />
          )}
          {showEndFade && (
            <div className="pointer-events-none absolute inset-y-0 right-0 w-8 rounded-r-xl bg-linear-to-l from-slate-900/90 to-transparent" />
          )}
        </div>

        <button
          type="button"
          onClick={() => appendRows([{}])}
          className="mt-3 flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-300 transition hover:border-violet-500 hover:text-white"
        >
          <Plus size={15} />
          Add Row
        </button>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Create Dataset</h2>

          <p className="mt-2 text-sm text-slate-400">Build a table — add columns with a data type, fill in rows, then save it. No CSV needed.</p>

          {hasDataset && (
            <p className="mt-1 text-sm text-amber-400">
              Saving this will replace &quot;{fileName}&quot; as your active dataset — it'll still be kept in Recent Datasets.
            </p>
          )}
        </div>

        {hasDataset && (
          <button
            type="button"
            onClick={() => {
              setForceNewTable(false);
              setDatasetName("");
              setColumnDefs([]);
              setPendingRows([]);
              setSaveError(null);
            }}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-300 transition hover:border-slate-500 hover:text-white"
          >
            <X size={15} />
            Cancel
          </button>
        )}
      </div>

      <div className="mt-6">
        <p className="text-sm font-medium text-slate-300">Dataset name</p>

        <input
          type="text"
          value={datasetName}
          onChange={(event) => setDatasetName(event.target.value)}
          placeholder="e.g. Daily Sales"
          className="mt-2 w-full max-w-xs rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm outline-none focus:border-violet-500"
        />

        <p className="mt-5 text-sm font-medium text-slate-300">Add a column</p>

        <div className="mt-2 flex flex-wrap gap-2">
          <input
            type="text"
            value={newColumnName}
            onChange={(event) => setNewColumnName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addColumn();
              }
            }}
            placeholder="Column name, e.g. Product"
            className="max-w-xs flex-1 rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm outline-none focus:border-violet-500"
          />

          <select
            value={newColumnType}
            onChange={(event) => setNewColumnType(event.target.value as ColumnType)}
            className="rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm outline-none focus:border-violet-500"
          >
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="date">Date</option>
          </select>

          <button
            type="button"
            onClick={addColumn}
            className="flex items-center gap-1 rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium transition hover:bg-violet-700"
          >
            <Plus size={15} />
            Add Column
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-2">
          <div className="min-w-40 flex-1">
            <label htmlFor="builder-calculated-column-name" className="text-xs font-medium text-slate-400">
              Calculated column
            </label>
            <input
              id="builder-calculated-column-name"
              type="text"
              value={newCalculatedColumnName}
              onChange={(event) => setNewCalculatedColumnName(event.target.value)}
              placeholder="e.g. Profit"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm outline-none focus:border-violet-500"
            />
          </div>
          <div className="min-w-52 flex-[2]">
            <label htmlFor="builder-calculated-column-formula" className="text-xs font-medium text-slate-400">
              Formula
            </label>
            <input
              id="builder-calculated-column-formula"
              type="text"
              value={newCalculatedFormula}
              onChange={(event) => setNewCalculatedFormula(event.target.value)}
              placeholder="[Revenue] - [Cost]"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm outline-none focus:border-violet-500"
            />
          </div>
          <button
            type="button"
            onClick={handleAddCalculatedColumn}
            className="flex items-center gap-1 rounded-lg border border-violet-500/50 px-3 py-2 text-sm font-medium text-violet-200 transition hover:bg-violet-500/10"
          >
            <Calculator size={15} />
            Add Formula
          </button>
          {calculatedColumnError && (
            <p role="alert" className="w-full text-sm text-red-400">
              {calculatedColumnError}
            </p>
          )}
          <p className="w-full text-xs text-slate-500">Use column names in brackets and +, -, *, /, %, ^, and parentheses.</p>
          <CalculatedColumnHelp availableColumns={columnDefs.map((column) => column.name)} onUseExample={useCalculatedColumnExample} />
        </div>
      </div>

      {columnRenameError && <p role="alert" className="mt-2 text-sm text-red-400">{columnRenameError}</p>}
      <p className="mt-2 text-xs text-slate-500">Drag a column by its grip, or use the arrows on mobile to change its position. Rename columns with the pencil icon.</p>

      {columnDefs.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 text-sm font-medium text-slate-300">Table</p>

          <div className="relative">
            <div ref={scrollContainerRef} className="glass-scrollbar overflow-auto rounded-xl border border-slate-700">
              <table ref={tableRef} className="w-full text-sm">
                <thead className="bg-slate-800/60">
                  <tr>
                    {columnDefs.map((column) => (
                      <th key={column.name} className="px-3 py-2 text-left font-semibold text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <span title={column.formula ? `Formula: ${column.formula}` : undefined}>{column.name}</span>
                          {column.formula && <span className="text-[10px] text-violet-300">ƒx</span>}

                          <span className="rounded bg-slate-700/60 px-1.5 py-0.5 text-[10px] font-normal text-slate-400">
                            {TYPE_LABELS[column.type]}
                          </span>

                          <button
                            type="button"
                            onClick={() => removeColumn(column.name)}
                            aria-label={`Remove column ${column.name}`}
                            className="ml-auto text-slate-500 hover:text-red-400"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </th>
                    ))}

                    <th className="w-10" />
                  </tr>
                </thead>

                <tbody>
                  {pendingRows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-t border-slate-700">
                      {columnDefs.map((column, colIndex) => (
                        <td key={column.name} className="px-3 py-2">
                          <input
                            type={column.type === "number" ? "number" : column.type === "date" ? "date" : "text"}
                            value={row[column.name] ?? ""}
                            onChange={(event) => updatePendingCell(rowIndex, column.name, event.target.value)}
                            onKeyDown={(event) => handleCellArrowNav(event, rowIndex, colIndex)}
                            readOnly={Boolean(column.formula)}
                            title={column.formula ? `Calculated from ${column.formula}` : undefined}
                            data-row={rowIndex}
                            data-col={colIndex}
                            className={`w-full min-w-[8rem] rounded-md border border-transparent px-2 py-1.5 text-sm outline-none focus:border-violet-500 ${column.formula ? "bg-violet-950/30 text-violet-100" : "bg-slate-950/40"}`}
                          />
                        </td>
                      ))}

                      <td className="px-2 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removePendingRow(rowIndex)}
                          aria-label={`Remove row ${rowIndex + 1}`}
                          className="text-slate-500 hover:text-red-400"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Hints that the table scrolls — there's no visible scrollbar on touch devices to
                make the overflow obvious otherwise. */}
            {showStartFade && (
              <div className="pointer-events-none absolute inset-y-0 left-0 w-8 rounded-l-xl bg-linear-to-r from-slate-900/90 to-transparent" />
            )}
            {showEndFade && (
              <div className="pointer-events-none absolute inset-y-0 right-0 w-8 rounded-r-xl bg-linear-to-l from-slate-900/90 to-transparent" />
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={addPendingRow}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-300 transition hover:border-violet-500 hover:text-white"
            >
              <Plus size={15} />
              Add Row
            </button>

            <button
              type="button"
              onClick={handleSaveTable}
              className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium transition hover:bg-violet-700"
            >
              <Save size={15} />
              Save Dataset
            </button>

            {saveError && <span className="text-sm text-red-400">{saveError}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

export default ManualEntry;
