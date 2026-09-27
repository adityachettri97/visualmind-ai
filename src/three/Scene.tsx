import { useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { MOUSE } from "three";
import type { ComponentRef } from "react";

import Lights from "./Lights";
import Ground from "./Ground";
import FloatingNodes from "./FloatingNodes";
import Connections from "./Connections";
import Effects from "./Effects";
import DragPan from "./DragPan";
import BarChartScene from "./BarChartScene";

interface SceneProps {
  barMode?: boolean;
}

function Scene({ barMode = false }: SceneProps) {
  const controlsRef = useRef<ComponentRef<typeof OrbitControls>>(null);

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{
        position: [0, 5, 12],
        fov: 50,
      }}
      style={{ touchAction: "none" }}
    >
      <Lights />

      <OrbitControls
        ref={controlsRef}
        enablePan
        enableZoom
        enableRotate
        enableDamping
        dampingFactor={0.08}
        zoomSpeed={0.8}
        minDistance={6}
        maxDistance={26}
        mouseButtons={{ MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.ROTATE }}
      />

      <DragPan controlsRef={controlsRef} />

      {/* <CameraController /> */}

      {!barMode && <Ground />}

      {!barMode && <Connections />}
      {!barMode && <FloatingNodes />}
      {barMode && <BarChartScene />}
      <Effects />
    </Canvas>
  );
}

export default Scene;
