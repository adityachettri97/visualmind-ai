export function normalize(value: number, min: number, max: number): number {
  if (max <= min) return 0.5;

  return Math.min(1, Math.max(0, (value - min) / (max - min)));
}

export function clusterPosition(index: number, total: number, radius = 5): [number, number, number] {
  if (total <= 1) return [0, 0, 0];

  const angle = (index / total) * Math.PI * 2;

  return [Math.cos(angle) * radius, Math.sin(angle) * radius, 0];
}
