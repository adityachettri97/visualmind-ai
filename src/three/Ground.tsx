import { Grid } from "@react-three/drei";
import { useThemeStore } from "../store/themeStore";

interface GroundProps {
  position?: [number, number, number];
}

function Ground({ position = [0, -1.5, 0] }: GroundProps) {
  const isLightTheme = useThemeStore((state) => state.theme === "light");

  return (
    <Grid
      position={position}
      args={[40, 40]}
      cellSize={1}
      cellThickness={isLightTheme ? 0.55 : 0.35}
      cellColor={isLightTheme ? "#64748b" : "#274276"}
      sectionSize={5}
      sectionThickness={isLightTheme ? 1.25 : 1.1}
      sectionColor={isLightTheme ? "#66577f" : "#62459a"}
      // The grid is fully invisible past fadeDistance from the camera's ground point (not just
      // dim — alpha hits exactly 0), and DragPan/ZoomToCursor let users roam freely to explore
      // large datasets. 50 units was too tight: panning/zooming out to see a big graph routinely
      // pushed part of the view past that radius, leaving nodes floating over bare background.
      // followCamera keeps the (shader-side infinite) grid re-centered under wherever the camera
      // currently is, so the fade radius is never measured from a stale, panned-away origin.
      fadeDistance={150}
      fadeStrength={1.15}
      infiniteGrid
      followCamera
    />
  );
}

export default Ground;
