import type { GraphNode, VisualizationMode } from "../types/graph";
import type { DatasetAnalysis } from "./analyzeDataset";
import { getColorForIndex } from "./colors";
import { normalize, clusterPosition } from "./math";
import { getCurrencySymbolForRegion } from "./currency";
import { useAuthStore } from "../store/authStore";

export interface DatasetRow {
  [key: string]: string;
}

export interface GroupSummary {
  group: string;
  count: number;
  total: number;
}

const CURRENCY_KEYWORDS = ["sales", "revenue", "amount", "price", "cost", "profit", "total", "value"];

export function formatValue(column: string | null, raw: number): string {
  if (!column) return "N/A";

  const isCurrency = CURRENCY_KEYWORDS.some((keyword) => column.toLowerCase().includes(keyword));

  if (!isCurrency) return raw.toLocaleString();

  const symbol = getCurrencySymbolForRegion(useAuthStore.getState().user?.region);

  return `${symbol}${raw.toLocaleString()}`;
}

interface NodeMeta {
  group: string;
  sizeFactor: number;
}

// Nodes render as spheres whose radius grows with value/highlight state (see FloatingNode.tsx);
// this is a comfortable center-to-center clearance for the largest realistic case.
const NODE_SPACING = 1.5;

/** Deterministic pseudo-random value in [0, 1), stable across renders for a given seed. */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;

  return x - Math.floor(x);
}

function groupIndices(meta: NodeMeta[]): Map<string, number[]> {
  const map = new Map<string, number[]>();

  meta.forEach((item, index) => {
    const list = map.get(item.group) ?? [];

    list.push(index);
    map.set(item.group, list);
  });

  return map;
}

/** Rough bounding radius for `count` nodes spaced `spacing` apart, however they end up packed. */
function groupFootprint(count: number, spacing: number): number {
  return Math.max(spacing, spacing * Math.sqrt(count) * 0.6);
}

/** How far apart cluster centers need to sit on their circle so the largest group's footprint can't reach its neighbor. */
function clusterRadiusFor(groupCount: number, maxFootprint: number): number {
  if (groupCount <= 1) return 0;

  return Math.max(5, maxFootprint / Math.sin(Math.PI / groupCount) + 1);
}

function computeClusterLayout(meta: NodeMeta[], groups: string[]): [number, number, number][] {
  const indicesByGroup = groupIndices(meta);

  // Keep each group's grid roughly square instead of always 3-wide — a group of 30 no longer
  // grows into a tall column that drifts down into whatever cluster sits below it.
  const columnsByGroup = new Map<string, number>();
  const footprintByGroup = new Map<string, number>();

  indicesByGroup.forEach((indices, group) => {
    const columns = Math.max(1, Math.ceil(Math.sqrt(indices.length)));
    const rows = Math.ceil(indices.length / columns);

    columnsByGroup.set(group, columns);
    footprintByGroup.set(group, (Math.max(columns, rows) * NODE_SPACING) / 2 + 0.5);
  });

  const maxFootprint = Math.max(...Array.from(footprintByGroup.values()), 2.5);
  const radius = clusterRadiusFor(groups.length, maxFootprint);
  const groupCenter = new Map(groups.map((group, index) => [group, clusterPosition(index, groups.length, radius || 5)]));

  const positions: [number, number, number][] = new Array(meta.length);

  indicesByGroup.forEach((indices, group) => {
    const center = groupCenter.get(group) ?? [0, 0, 0];
    const columns = columnsByGroup.get(group) ?? 1;
    const rows = Math.ceil(indices.length / columns);

    indices.forEach((nodeIndex, localIndex) => {
      const column = localIndex % columns;
      const row = Math.floor(localIndex / columns);

      const x = center[0] + (column - (columns - 1) / 2) * NODE_SPACING;
      const y = center[1] + ((rows - 1) / 2 - row) * NODE_SPACING;

      positions[nodeIndex] = [x, y, center[2]];
    });
  });

  return positions;
}

/** A lightweight simulated force-directed layout: nodes start scattered around their group's center, then relax apart. */
function computeForceLayout(meta: NodeMeta[], groups: string[]): [number, number, number][] {
  const indicesByGroup = groupIndices(meta);

  const footprintByGroup = new Map<string, number>();

  indicesByGroup.forEach((indices, group) => {
    footprintByGroup.set(group, groupFootprint(indices.length, NODE_SPACING));
  });

  const maxFootprint = Math.max(...Array.from(footprintByGroup.values()), 2.5);
  const radius = clusterRadiusFor(groups.length, maxFootprint);
  const groupCenter = new Map(groups.map((group, index) => [group, clusterPosition(index, groups.length, radius || 5)]));

  const positions: [number, number, number][] = meta.map((item, index) => {
    const center = groupCenter.get(item.group) ?? [0, 0, 0];
    const spread = footprintByGroup.get(item.group) ?? NODE_SPACING;
    const angle = seededRandom(index * 3 + 1) * Math.PI * 2;
    const spawnRadius = seededRandom(index * 3 + 2) * spread * 0.8;

    return [center[0] + Math.cos(angle) * spawnRadius, center[1] + Math.sin(angle) * spawnRadius, center[2]];
  });

  const minDistance = NODE_SPACING;

  for (let iteration = 0; iteration < 60; iteration++) {
    for (let i = 0; i < positions.length; i++) {
      const center = groupCenter.get(meta[i].group) ?? [0, 0, 0];

      // Weak pull back toward the group center so nodes don't drift away indefinitely.
      positions[i][0] += (center[0] - positions[i][0]) * 0.01;
      positions[i][1] += (center[1] - positions[i][1]) * 0.01;

      for (let j = i + 1; j < positions.length; j++) {
        if (meta[i].group !== meta[j].group) continue;

        const dx = positions[j][0] - positions[i][0];
        const dy = positions[j][1] - positions[i][1];
        const distance = Math.sqrt(dx * dx + dy * dy) || 0.0001;

        if (distance < minDistance) {
          const push = (minDistance - distance) / 2;
          const nx = (dx / distance) * push;
          const ny = (dy / distance) * push;

          positions[j][0] += nx;
          positions[j][1] += ny;
          positions[i][0] -= nx;
          positions[i][1] -= ny;
        }
      }
    }
  }

  return positions;
}

/** Nodes scattered across an area that grows with dataset size, ignoring grouping — height driven by value. */
function computeScatterLayout(meta: NodeMeta[]): [number, number, number][] {
  const areaScale = Math.max(1, Math.sqrt(meta.length / 20));
  const xRange = 14 * areaScale;
  const zRange = 6 * areaScale;

  const positions: [number, number, number][] = meta.map((item, index) => {
    const x = (seededRandom(index * 2 + 1) - 0.5) * xRange;
    const z = (seededRandom(index * 2 + 2) - 0.5) * zRange;
    const y = -1 + item.sizeFactor * 5;

    return [x, y, z];
  });

  // A pass of pure separation catches whatever random collisions the wider area doesn't avoid on its own.
  const minDistance = NODE_SPACING * 0.8;

  for (let iteration = 0; iteration < 20; iteration++) {
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const dx = positions[j][0] - positions[i][0];
        const dz = positions[j][2] - positions[i][2];
        const distance = Math.sqrt(dx * dx + dz * dz) || 0.0001;

        if (distance < minDistance) {
          const push = (minDistance - distance) / 2;
          const nx = (dx / distance) * push;
          const nz = (dz / distance) * push;

          positions[j][0] += nx;
          positions[j][2] += nz;
          positions[i][0] -= nx;
          positions[i][2] -= nz;
        }
      }
    }
  }

  return positions;
}

// Cluster/Force spread nodes across a 2D grid, so two large, ring-highlighted nodes rarely land
// right next to each other. Timeline forces every row into a single line by dataset order, so
// consecutive rows with similar (often both-large) values — common in real, non-random data —
// regularly end up adjacent. A node's rendered extent at max value with a ring reaches out to
// roughly 1.05 world units, well past NODE_SPACING (1.5), so Timeline needs its own, wider base
// spacing rather than reusing the grid-mode constant.
const TIMELINE_SPACING = 2.4;
const TIMELINE_MIN_SPACING = 1.3;

/** Nodes arranged left-to-right in their original dataset order — height driven by value. */
function computeTimelineLayout(meta: NodeMeta[]): [number, number, number][] {
  const total = meta.length;
  // Keep the line from growing unbounded on very large datasets, without letting nodes touch.
  const spacing = total > 40 ? Math.max(TIMELINE_MIN_SPACING, TIMELINE_SPACING * (40 / total)) : TIMELINE_SPACING;

  return meta.map((item, index) => {
    const x = (index - (total - 1) / 2) * spacing;
    const y = -1 + item.sizeFactor * 5;

    return [x, y, 0];
  });
}

function computePositions(meta: NodeMeta[], groups: string[], mode: VisualizationMode): [number, number, number][] {
  switch (mode) {
    case "scatter":
      return computeScatterLayout(meta);
    case "timeline":
      return computeTimelineLayout(meta);
    case "force":
      return computeForceLayout(meta, groups);
    default:
      return computeClusterLayout(meta, groups);
  }
}

export function datasetToGraph(data: DatasetRow[], analysis: DatasetAnalysis | null, mode: VisualizationMode = "cluster"): GraphNode[] {
  if (!data || data.length === 0) return [];

  const labelColumn = analysis?.labelColumn ?? null;
  const groupColumn = analysis?.groupColumn ?? null;
  const valueColumn = analysis?.valueColumn ?? null;

  // Discover groups (regions/categories) dynamically instead of assuming North/South/East/West.
  const groups = groupColumn ? Array.from(new Set(data.map((row) => row[groupColumn] || "Unknown"))) : ["All"];
  const groupColor = new Map(groups.map((group, index) => [group, getColorForIndex(index)]));

  const values = valueColumn ? data.map((row) => Number(row[valueColumn]) || 0) : [];
  const minValue = values.length > 0 ? Math.min(...values) : 0;
  const maxValue = values.length > 0 ? Math.max(...values) : 0;

  const meta: NodeMeta[] = data.map((row) => {
    const group = groupColumn ? row[groupColumn] || "Unknown" : "All";
    const rawValue = valueColumn ? Number(row[valueColumn]) || 0 : 0;
    const sizeFactor = valueColumn ? normalize(rawValue, minValue, maxValue) : 0.5;

    return { group, sizeFactor };
  });

  const positions = computePositions(meta, groups, mode);

  return data.map((row, index) => {
    const { group, sizeFactor } = meta[index];
    const rawValue = valueColumn ? Number(row[valueColumn]) || 0 : 0;
    const label = labelColumn ? row[labelColumn] || `Row ${index + 1}` : `Row ${index + 1}`;
    const formattedValue = formatValue(valueColumn, rawValue);

    const summaryValuePart = valueColumn ? `generated ${formattedValue}` : "has no numeric value column to summarize";

    return {
      id: index + 1,
      label,
      position: positions[index],
      color: groupColor.get(group) ?? getColorForIndex(0),
      value: formattedValue,
      region: group,
      growth: "N/A",
      confidence: "N/A",
      sizeFactor,
      rawValue,
      summary: groupColumn ? `${label} ${summaryValuePart} in ${group}.` : `${label} ${summaryValuePart}.`,
    };
  });
}

/** Sum of the detected value column across the dataset, or 0 if no numeric column was found. */
export function computeValueTotal(data: DatasetRow[], analysis: DatasetAnalysis | null): number {
  const valueColumn = analysis?.valueColumn ?? null;

  if (!valueColumn || !data) return 0;

  return data.reduce((total, row) => total + (Number(row[valueColumn]) || 0), 0);
}

/** Per-group row count and value total, sorted by total descending. Empty if no group column was detected. */
export function summarizeByGroup(data: DatasetRow[], analysis: DatasetAnalysis | null): GroupSummary[] {
  const groupColumn = analysis?.groupColumn ?? null;
  const valueColumn = analysis?.valueColumn ?? null;

  if (!groupColumn || !data || data.length === 0) return [];

  const totals = new Map<string, { count: number; total: number }>();

  data.forEach((row) => {
    const group = row[groupColumn] || "Unknown";
    const value = valueColumn ? Number(row[valueColumn]) || 0 : 0;
    const existing = totals.get(group) ?? { count: 0, total: 0 };

    existing.count += 1;
    existing.total += value;
    totals.set(group, existing);
  });

  return Array.from(totals.entries())
    .map(([group, { count, total }]) => ({ group, count, total }))
    .sort((a, b) => b.total - a.total);
}
