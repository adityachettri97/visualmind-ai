import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { Plane, Raycaster, Vector2, Vector3 } from "three";
import type { ComponentRef } from "react";
import type { OrbitControls } from "@react-three/drei";

type OrbitControlsInstance = ComponentRef<typeof OrbitControls>;

interface ZoomToCursorProps {
  controlsRef: React.RefObject<OrbitControlsInstance | null>;
}

const ZOOM_SPEED = 0.0015;
const MIN_ZOOM_FACTOR = 0.85;
const MAX_ZOOM_FACTOR = 1.15;

/**
 * Replaces OrbitControls' default wheel-zoom (which always dollies toward its fixed target)
 * with a "zoom to cursor" dolly: the point under the mouse stays put while the camera moves.
 */
function ZoomToCursor({ controlsRef }: ZoomToCursorProps) {
  const { camera, gl } = useThree();
  const raycaster = useRef(new Raycaster());
  const plane = useRef(new Plane());
  const intersection = useRef(new Vector3());
  const cameraDirection = useRef(new Vector3());

  useEffect(() => {
    const canvas = gl.domElement;

    const handleWheel = (event: WheelEvent) => {
      const controls = controlsRef.current;

      if (!controls) return;

      event.preventDefault();

      const rect = canvas.getBoundingClientRect();
      const ndcX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const ndcY = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // A plane through the current orbit target, facing the camera — stable regardless of scene content.
      camera.getWorldDirection(cameraDirection.current);
      plane.current.setFromNormalAndCoplanarPoint(cameraDirection.current, controls.target);

      raycaster.current.setFromCamera(new Vector2(ndcX, ndcY), camera);

      const hit = raycaster.current.ray.intersectPlane(plane.current, intersection.current);

      if (!hit) return;

      const zoomFactor = Math.min(Math.max(1 + event.deltaY * ZOOM_SPEED, MIN_ZOOM_FACTOR), MAX_ZOOM_FACTOR);

      // Scale the camera's (and target's) offset from the cursor point instead of from the target —
      // this is what makes the point under the cursor stay fixed on screen while zooming.
      camera.position.lerpVectors(intersection.current, camera.position, zoomFactor);
      controls.target.lerpVectors(intersection.current, controls.target, zoomFactor);
      controls.update();
    };

    canvas.addEventListener("wheel", handleWheel, { passive: false });

    return () => canvas.removeEventListener("wheel", handleWheel);
  }, [camera, gl, controlsRef]);

  return null;
}

export default ZoomToCursor;
