import { Line } from "@react-three/drei";
import FlowParticle from "./FlowParticle";

interface Props {
  points: [number, number, number][];
  showParticle?: boolean;
}

function Connection({ points, showParticle = true }: Props) {
  return (
    <>
      <Line points={points} color="#8b5cf6" lineWidth={2} transparent opacity={0.5} />

      {showParticle && <FlowParticle start={points[0]} end={points[1]} />}
    </>
  );
}

export default Connection;
