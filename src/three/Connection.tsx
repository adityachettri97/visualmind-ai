import { Line } from "@react-three/drei";
import FlowParticle from "./FlowParticle";

interface Props {
  points: [number, number, number][];
  showParticle?: boolean;
  /** A filter is active and at least one endpoint doesn't match it — fade the line and drop its
      traveling glow, matching how the endpoint nodes themselves get dimmed. */
  dimmed?: boolean;
}

function Connection({ points, showParticle = true, dimmed = false }: Props) {
  return (
    <>
      <Line points={points} color="#8b5cf6" lineWidth={2} transparent opacity={dimmed ? 0.12 : 0.5} />

      {showParticle && !dimmed && <FlowParticle start={points[0]} end={points[1]} />}
    </>
  );
}

export default Connection;
