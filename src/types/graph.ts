export interface GraphNode {
  id: number;
  label: string;
  position: [number, number, number];
  color: string;
  value: string;
  region: string;
  growth: string;
  confidence: string;
  summary: string;
  /** Normalized 0-1 position of this node's value within the dataset's min/max range. */
  sizeFactor: number;
  /** Unformatted numeric value backing `value`/`sizeFactor` — 0 when there's no value column. */
  rawValue: number;
}

export interface GraphConnection {
  from: number;
  to: number;
}

export type VisualizationMode = "scatter" | "force" | "cluster" | "timeline" | "heatmap" | "treemap";
