import jsep from "jsep";

export type CalculatedColumns = Record<string, string>;

type FormulaEvaluator = (row: Record<string, string>) => number | null;

const ALLOWED_OPERATORS = new Set(["+", "-", "*", "/", "%", "^"]);
jsep.addBinaryOp("^", 11, true);

interface FormulaNode {
  type: string;
  value?: unknown;
  name?: string;
  operator?: string;
  left?: FormulaNode;
  right?: FormulaNode;
  argument?: FormulaNode;
}

function validateNode(node: FormulaNode, availableSymbols: Set<string>): void {
  if (node.type === "Literal" && typeof node.value === "number") return;

  if (node.type === "Identifier" && node.name && availableSymbols.has(node.name)) return;

  if (node.type === "UnaryExpression" && (node.operator === "+" || node.operator === "-") && node.argument) {
    validateNode(node.argument, availableSymbols);
    return;
  }

  if (node.type === "BinaryExpression" && node.operator && ALLOWED_OPERATORS.has(node.operator) && node.left && node.right) {
    validateNode(node.left, availableSymbols);
    validateNode(node.right, availableSymbols);
    return;
  }

  throw new Error("Use only numbers, bracketed column names, +, -, *, /, %, ^, and parentheses.");
}

function evaluateNode(node: FormulaNode, scope: Record<string, number>): number {
  if (node.type === "Literal" && typeof node.value === "number") return node.value;
  if (node.type === "Identifier" && node.name) return scope[node.name];

  if (node.type === "UnaryExpression" && node.operator && node.argument) {
    const value = evaluateNode(node.argument, scope);

    return node.operator === "-" ? -value : value;
  }

  if (node.type === "BinaryExpression" && node.operator && node.left && node.right) {
    const left = evaluateNode(node.left, scope);
    const right = evaluateNode(node.right, scope);

    switch (node.operator) {
      case "+":
        return left + right;
      case "-":
        return left - right;
      case "*":
        return left * right;
      case "/":
        return left / right;
      case "%":
        return left % right;
      case "^":
        return left ** right;
    }
  }

  throw new Error("Unsupported formula expression.");
}

export function compileCalculatedFormula(formula: string, columnNames: string[]): FormulaEvaluator {
  const references = new Map<string, string>();
  const expression = formula.replace(/\[([^\]]+)\]/g, (_match, rawName: string) => {
    const columnName = rawName.trim();

    if (!columnNames.includes(columnName)) throw new Error(`Unknown column: ${columnName || "(empty)"}.`);

    const existingAlias = Array.from(references.entries()).find(([, name]) => name === columnName)?.[0];

    if (existingAlias) return existingAlias;

    const alias = `column_${references.size}`;
    references.set(alias, columnName);
    return alias;
  });

  if (references.size === 0) throw new Error("Add at least one column reference using square brackets, such as [Revenue].");
  if (expression.includes("[") || expression.includes("]")) throw new Error("Check the square brackets around each column name.");

  let tree: FormulaNode;

  try {
    tree = jsep(expression) as FormulaNode;
  } catch {
    throw new Error("Formula syntax is invalid. Use +, -, *, /, %, ^, and parentheses.");
  }

  const availableSymbols = new Set(references.keys());
  validateNode(tree, availableSymbols);

  return (row) => {
    const scope: Record<string, number> = {};

    for (const [alias, columnName] of references) {
      const value = row[columnName]?.trim();

      if (!value) return null;

      const number = Number(value);

      if (!Number.isFinite(number)) return null;

      scope[alias] = number;
    }

    const result = evaluateNode(tree, scope);

    return Number.isFinite(result) ? result : null;
  };
}

export function recalculateCalculatedColumns(rows: Record<string, string>[], formulas: CalculatedColumns): Record<string, string>[] {
  const columnNames = Array.from(new Set([...Object.keys(rows[0] ?? {}), ...Object.keys(formulas)]));
  let result = rows.map((row) => ({ ...row }));

  for (const [columnName, formula] of Object.entries(formulas)) {
    let evaluate: FormulaEvaluator;

    try {
      evaluate = compileCalculatedFormula(formula, columnNames);
    } catch {
      result = result.map((row) => ({ ...row, [columnName]: "" }));
      continue;
    }

    result = result.map((row) => {
      const value = evaluate(row);
      const rounded = value === null ? "" : String(Number(value.toFixed(8)));

      return { ...row, [columnName]: rounded };
    });
  }

  return result;
}

export function formulaReferencesColumn(formula: string, columnName: string): boolean {
  return Array.from(formula.matchAll(/\[([^\]]+)\]/g)).some(([, reference]) => reference.trim() === columnName);
}
