interface HighlightRingProps {
  /** The sphere's own radius — the ring is sized relative to this, not an absolute number. */
  sphereRadius: number;
  color: string;
  /** How far out this ring sits, as a multiple of sphereRadius — use increasing values to nest rings. */
  gap: number;
}

/**
 * A torus (not a flat ring) so it stays visible from any camera angle — a flat disc can go
 * edge-on and vanish as the user orbits the scene, a torus never fully disappears.
 */
function HighlightRing({ sphereRadius, color, gap }: HighlightRingProps) {
  const ringRadius = sphereRadius * gap;

  return (
    <mesh rotation={[Math.PI / 2, 0.15, 0]}>
      <torusGeometry args={[ringRadius, 0.028, 8, 40]} />
      <meshBasicMaterial color={color} toneMapped={false} />
    </mesh>
  );
}

export default HighlightRing;
