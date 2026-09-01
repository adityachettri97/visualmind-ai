export const nodePalette = [
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#10b981", // emerald
  "#f97316", // orange
  "#f43f5e", // rose
  "#eab308", // amber
  "#3b82f6", // blue
  "#ec4899", // pink
  "#22c55e", // green
  "#a855f7", // purple
];

export function getColorForIndex(index: number): string {
  return nodePalette[index % nodePalette.length];
}
