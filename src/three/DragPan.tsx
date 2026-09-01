import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { PerspectiveCamera, Vector3 } from "three";
import interact from "interactjs";
import type { ComponentRef } from "react";
import type { OrbitControls } from "@react-three/drei";

type OrbitControlsInstance = ComponentRef<typeof OrbitControls>;

interface DragPanProps {
  controlsRef: React.RefObject<OrbitControlsInstance | null>;
}

/**
 * Left-drag pans the camera (grab-and-drag the scene), driven by interact.js instead of
 * OrbitControls' own pointer handling. Right-drag still rotates via OrbitControls itself —
 * the two are kept on separate mouse buttons so they never fight over the same gesture.
 *
 * `buttons` (plural, a bitmask of currently-held buttons) is what's reliable on a continuous
 * `move` event — the singular `button` property only means anything on press/release events.
 */
function DragPan({ controlsRef }: DragPanProps) {
  const { camera, gl } = useThree();
  const offset = useRef(new Vector3());
  const panOffset = useRef(new Vector3());
  const axis = useRef(new Vector3());

  useEffect(() => {
    const canvas = gl.domElement;

    const interactable = interact(canvas).draggable({
      listeners: {
        move(event: { buttons?: number; dx: number; dy: number }) {
          // Only the primary (left) button pans; leave right-drag alone for OrbitControls' rotate.
          if (event.buttons !== undefined && event.buttons !== 1) return;

          const controls = controlsRef.current;

          if (!controls) return;

          offset.current.copy(camera.position).sub(controls.target);

          let targetDistance = offset.current.length();
          const fov = camera instanceof PerspectiveCamera ? camera.fov : 50;

          targetDistance *= Math.tan((fov / 2) * (Math.PI / 180));

          const height = canvas.clientHeight || 1;
          const panLeftAmount = (2 * event.dx * targetDistance) / height;
          const panUpAmount = (2 * event.dy * targetDistance) / height;

          panOffset.current.set(0, 0, 0);

          axis.current.setFromMatrixColumn(camera.matrix, 0);
          axis.current.multiplyScalar(-panLeftAmount);
          panOffset.current.add(axis.current);

          axis.current.setFromMatrixColumn(camera.matrix, 1);
          axis.current.multiplyScalar(panUpAmount);
          panOffset.current.add(axis.current);

          camera.position.add(panOffset.current);
          controls.target.add(panOffset.current);
          controls.update();
        },
      },
    });

    return () => {
      interactable.unset();
    };
  }, [camera, gl, controlsRef]);

  return null;
}

export default DragPan;
