import { Line } from "@react-three/drei";
import FlowParticle from "./FlowParticle";
import { useThemeStore } from "../store/themeStore";

interface Props {
  points: [number, number, number][];
  showParticle?: boolean;
}

function Connection({ points, showParticle = true }: Props) {
  const isLightTheme = useThemeStore((state) => state.theme === "light");

  return (
    <>
      <Line
        points={points}
        color={isLightTheme ? "#5b21b6" : "#8b5cf6"}
        lineWidth={isLightTheme ? 2.5 : 2}
        transparent
        opacity={isLightTheme ? 0.85 : 0.5}
      />

      {showParticle && <FlowParticle start={points[0]} end={points[1]} />}
    </>
  );
}

export default Connection;
