import { useFrame, useThree } from "@react-three/fiber";
import { Vector3 } from "three";
import { useNodeStore } from "../store/nodeStore";

function CameraController() {
  const { camera } = useThree();
  const { selectedNode } = useNodeStore();

  useFrame(() => {
    if (!selectedNode) return;

    const targetPosition = new Vector3(selectedNode.position[0], selectedNode.position[1] + 2, selectedNode.position[2] + 5);

    camera.position.lerp(targetPosition, 0.05);
    camera.lookAt(selectedNode.position[0], selectedNode.position[1], selectedNode.position[2]);
  });

  return null;
}

export default CameraController;
