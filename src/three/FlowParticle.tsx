import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { useThemeStore } from "../store/themeStore";

interface Props {
  start: [number, number, number];
  end: [number, number, number];
  speed?: number;
}

const TRAIL_LENGTH = 5;
const TRAIL_SPACING = 0.07;
// Kept well clear of zero so the modulo below is always positive regardless of elapsedTime/offset.
const PHASE_OFFSET = 1000;

/**
 * A short comet-style trail (bright head, fading/shrinking tail) traveling repeatedly along the
 * line — a single dot reads as "a dot", a trail reads unmistakably as "glow moving along this
 * connection".
 */
function FlowParticle({ start, end, speed = 0.35 }: Props) {
  const isLightTheme = useThemeStore((state) => state.theme === "light");
  const refs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(({ clock }) => {
    for (let i = 0; i < TRAIL_LENGTH; i++) {
      const mesh = refs.current[i];

      if (!mesh) continue;

      const t = (clock.elapsedTime * speed - i * TRAIL_SPACING + PHASE_OFFSET) % 1;

      mesh.position.set(
        THREE.MathUtils.lerp(start[0], end[0], t),
        THREE.MathUtils.lerp(start[1], end[1], t),
        THREE.MathUtils.lerp(start[2], end[2], t),
      );
    }
  });

  return (
    <>
      {Array.from({ length: TRAIL_LENGTH }).map((_, i) => (
        <mesh
          key={i}
          ref={(mesh) => {
            refs.current[i] = mesh;
          }}
        >
          <sphereGeometry args={[0.11 - i * 0.018, 12, 12]} />

          <meshStandardMaterial
            color={isLightTheme ? "#4c1d95" : "#ffffff"}
            emissive={isLightTheme ? "#7c3aed" : "#a78bfa"}
            emissiveIntensity={isLightTheme ? 5 - i * 0.8 : 14 - i * 2.4}
            transparent
            opacity={1 - i * 0.18}
          />
        </mesh>
      ))}
    </>
  );
}

export default FlowParticle;
