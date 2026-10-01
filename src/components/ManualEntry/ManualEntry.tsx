import { useRef, useState } from "react";
import { Calculator, FilePlus2, Plus, Save, Trash2, X } from "lucide-react";
import { useDatasetStore } from "../../store/datasetStore";
import { analyzeDataset } from "../../utils/analyzeDataset";
import { analyzeWithAI } from "../../services/aiService";
import { useScrollFade } from "../../hooks/useScrollFade";
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
    appendRows,
    updateCell,
    deleteRow,
    addColumn: addColumnToDataset,
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

  if (!showBuilder) {
    return (
      <div className="glass rounded-2xl p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Create Dataset</h2>

            <p className="mt-2 text-sm text-slate-400">
              Editing &quot;{fileName}&quot; — edit any cell, add or remove columns and rows. Changes save instantly.
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
        </div>

        <div className="relative mt-4">
          <div ref={scrollContainerRef} className="glass-scrollbar overflow-auto rounded-xl border border-slate-700">
            <table ref={tableRef} className="w-full text-sm">
              <thead className="bg-slate-800/60">
                <tr>
                  {analysis.columns.map((column) => (
                    <th key={column} className="px-3 py-2 text-left font-semibold text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <span title={calculatedColumns[column] ? `Formula: ${calculatedColumns[column]}` : undefined}>{column}</span>
                        {calculatedColumns[column] && <span className="text-[10px] text-violet-300">ƒx</span>}

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
        </div>
      </div>

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
