import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { useNodeStore } from "../store/nodeStore";
import type { GraphNode } from "../types/graph";
import HighlightRing from "./HighlightRing";
import { useThemeStore } from "../store/themeStore";

interface FloatingNodeProps {
  node: GraphNode;
  /** Highest value in the dataset (ties all shown) — computed client-side, always exact. */
  isTopPerformer: boolean;
  /** Lowest value in the dataset (ties all shown) — computed client-side, always exact. */
  isBottomPerformer: boolean;
  /** Ranked #2 or #3 by value, when not already the top performer. */
  isNotable: boolean;
  /** This node's category/region is the highest-total one. */
  isTopCategory: boolean;
}

const SPHERE_RADIUS = 0.35;

function FloatingNode({ node, isTopPerformer, isBottomPerformer, isNotable, isTopCategory }: FloatingNodeProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const target = useRef(new THREE.Vector3());
  const [hovered, setHovered] = useState(false);
  const { selectedNode, setSelectedNode } = useNodeStore();
  const isLightTheme = useThemeStore((state) => state.theme === "light");
  const isSelected = selectedNode?.id === node.id;

  const baseScale = 0.7 + node.sizeFactor * 0.8;

  useEffect(() => {
    return () => {
      document.body.style.cursor = "default";
    };
  }, []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    groupRef.current.position.y = node.position[1] + Math.sin(clock.elapsedTime + node.position[0]) * 0.25;

    groupRef.current.rotation.y += 0.01;

    const targetScale = hovered || isSelected ? baseScale * 1.2 : baseScale;

    target.current.set(targetScale, targetScale, targetScale);

    groupRef.current.scale.lerp(target.current, 0.08);
  });

  return (
    <group
      ref={groupRef}
      position={node.position}
      onPointerOver={() => {
        document.body.style.cursor = "pointer";
        setHovered(true);
      }}
      onPointerOut={() => {
        document.body.style.cursor = "default";
        setHovered(false);
      }}
      onClick={() => setSelectedNode(node)}
    >
      {isLightTheme && (
        <mesh>
          <sphereGeometry args={[SPHERE_RADIUS * 1.12, 24, 24]} />
          <meshBasicMaterial color="#334155" side={THREE.BackSide} />
        </mesh>
      )}

      <mesh>
        <sphereGeometry args={[SPHERE_RADIUS, 32, 32]} />

        <meshStandardMaterial color={node.color} emissive={node.color} emissiveIntensity={hovered || isSelected ? 3 : 1.8} />
      </mesh>

      {/* Rings are additive, never replace the sphere's category color — a node can show
          several at once (e.g. top performer that's also currently selected). */}
      {isTopPerformer && <HighlightRing sphereRadius={SPHERE_RADIUS} color="#facc15" gap={1.35} />}
      {!isTopPerformer && isBottomPerformer && <HighlightRing sphereRadius={SPHERE_RADIUS} color="#f43f5e" gap={1.35} />}
      {!isTopPerformer && !isBottomPerformer && isNotable && <HighlightRing sphereRadius={SPHERE_RADIUS} color="#c084fc" gap={1.35} />}
      {isTopCategory && <HighlightRing sphereRadius={SPHERE_RADIUS} color="#38bdf8" gap={1.65} />}
      {(hovered || isSelected) && <HighlightRing sphereRadius={SPHERE_RADIUS} color="#ffffff" gap={1.95} />}

      {hovered && (
        <Html distanceFactor={8}>
          <div className="node-tooltip rounded-lg bg-slate-900/90 border border-violet-500 px-3 py-2 text-white text-sm whitespace-nowrap shadow-xl">
            {node.label}
          </div>
        </Html>
      )}
    </group>
  );
}

export default FloatingNode;
