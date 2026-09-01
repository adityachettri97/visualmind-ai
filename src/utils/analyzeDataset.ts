export interface DatasetAnalysis {
  rowCount: number;
  columnCount: number;
  columns: string[];
  numericColumns: string[];
  textColumns: string[];
  /** Best text column to use as each node's label (highest-cardinality text column). */
  labelColumn: string | null;
  /** Best text column to use as each node's grouping/region (low-cardinality, repeated categories). */
  groupColumn: string | null;
  /** Best numeric column to drive node size/value. */
  valueColumn: string | null;
}

const VALUE_KEYWORDS = ["sales", "revenue", "amount", "price", "total", "profit", "value", "count", "score", "quantity", "units"];
const GROUP_KEYWORDS = ["region", "category", "group", "type", "department", "segment", "class", "state", "country", "team"];

function pickLabelColumn(data: Record<string, string>[], textColumns: string[]): string | null {
  if (textColumns.length === 0) return null;

  let best = textColumns[0];
  let bestRatio = -1;

  textColumns.forEach((column) => {
    const values = data.map((row) => row[column]).filter((value) => value !== undefined && value !== "");
    const uniqueCount = new Set(values).size;
    const ratio = values.length > 0 ? uniqueCount / values.length : 0;

    if (ratio > bestRatio) {
      bestRatio = ratio;
      best = column;
    }
  });

  return best;
}

function pickGroupColumn(data: Record<string, string>[], textColumns: string[], labelColumn: string | null): string | null {
  const candidates = textColumns.filter((column) => column !== labelColumn);

  if (candidates.length === 0) return null;

  // Prefer a column whose name suggests a category/region, even if every value happens to be
  // unique in this particular dataset (e.g. a 4-row sample where each region appears once).
  const keywordMatch = candidates.find((column) => GROUP_KEYWORDS.some((keyword) => column.toLowerCase().includes(keyword)));

  if (keywordMatch) return keywordMatch;

  let best: string | null = null;
  let bestUniqueCount = Infinity;

  candidates.forEach((column) => {
    const values = data.map((row) => row[column]).filter((value) => value !== undefined && value !== "");
    const uniqueCount = new Set(values).size;

    // A good grouping column repeats a small number of categories across many rows.
    if (uniqueCount > 1 && uniqueCount < values.length && uniqueCount < bestUniqueCount) {
      bestUniqueCount = uniqueCount;
      best = column;
    }
  });

  return best;
}

function pickValueColumn(numericColumns: string[]): string | null {
  if (numericColumns.length === 0) return null;

  const keywordMatch = numericColumns.find((column) => VALUE_KEYWORDS.some((keyword) => column.toLowerCase().includes(keyword)));

  return keywordMatch ?? numericColumns[0];
}

export function analyzeDataset(data: Record<string, string>[]): DatasetAnalysis {
  if (data.length === 0) {
    return {
      rowCount: 0,
      columnCount: 0,
      columns: [],
      numericColumns: [],
      textColumns: [],
      labelColumn: null,
      groupColumn: null,
      valueColumn: null,
    };
  }

  const columns = Object.keys(data[0]);

  const numericColumns: string[] = [];
  const textColumns: string[] = [];

  columns.forEach((column) => {
    const values = data.map((row) => row[column]).filter((value) => value !== undefined && value !== "");

    const isNumeric = values.length > 0 && values.every((value) => !isNaN(Number(value)));

    if (isNumeric) {
      numericColumns.push(column);
    } else {
      textColumns.push(column);
    }
  });

  const labelColumn = pickLabelColumn(data, textColumns);
  const groupColumn = pickGroupColumn(data, textColumns, labelColumn);
  const valueColumn = pickValueColumn(numericColumns);

  return {
    rowCount: data.length,
    columnCount: columns.length,
    columns,
    numericColumns,
    textColumns,
    labelColumn,
    groupColumn,
    valueColumn,
  };
}
