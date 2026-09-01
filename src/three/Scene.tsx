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
import ZoomToCursor from "./ZoomToCursor";
import DragPan from "./DragPan";

function Scene() {
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
        enableZoom={false}
        enableRotate
        mouseButtons={{ MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.ROTATE }}
      />

      <ZoomToCursor controlsRef={controlsRef} />

      <DragPan controlsRef={controlsRef} />

      {/* <CameraController /> */}

      <Ground />

      <Connections />
      {/* Temporary Cube */}
      <FloatingNodes />
      <Effects />
    </Canvas>
  );
}

export default Scene;
