import { Text } from "@react-three/drei";
import { useDatasetStore } from "../store/datasetStore";
import { useNodeStore } from "../store/nodeStore";
import { summarizeByGroup, formatValue } from "../utils/datasetToGraph";
import { getCurrencySymbolForRegion } from "../utils/currency";
import { useAuthStore } from "../store/authStore";

const BAR_COLORS = ["#8b5cf6", "#22d3ee", "#a78bfa", "#34d399", "#f59e0b", "#f472b6"];

function BarChartScene() {
  const { data, analysis } = useDatasetStore();
  const { selectedNode, setSelectedNode } = useNodeStore();
  const userRegion = useAuthStore((state) => state.user?.region ?? null);

  if (!data || data.length === 0) {
    return null;
  }

  const groups = summarizeByGroup(data, analysis)
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  if (groups.length === 0) {
    return null;
  }

  const maxTotal = Math.max(...groups.map((group) => group.total), 1);
  const currencySymbol = getCurrencySymbolForRegion(userRegion);

  return (
    <group position={[0, -1.2, 0]}>
      {groups.map((group, index) => {
        const barHeight = 0.8 + (group.total / maxTotal) * 6.5;
        const x = (index - (groups.length - 1) / 2) * 3.2;
        const y = barHeight / 2 - 1.6;
        const color = BAR_COLORS[index % BAR_COLORS.length];
        const valueText = `${currencySymbol}${Math.round(group.total).toLocaleString()}`;
        const isSelected = selectedNode?.label === group.group && selectedNode?.region === group.group;
        const groupNode = {
          id: index + 1,
          label: group.group,
          position: [x, y, 0] as [number, number, number],
          color,
          value: formatValue(analysis?.valueColumn ?? null, group.total),
          region: group.group,
          growth: "N/A",
          confidence: "N/A",
          summary: `${group.group} generated ${formatValue(analysis?.valueColumn ?? null, group.total)} in ${group.group}.`,
          sizeFactor: group.total / maxTotal,
          rawValue: group.total,
        };

        return (
          <group key={group.group} position={[x, 0, 0]}>
            <mesh
              position={[0, y, 0]}
              castShadow
              receiveShadow
              onClick={(event) => {
                event.stopPropagation();
                setSelectedNode(groupNode);
              }}
              onPointerOver={(event) => {
                event.stopPropagation();
                document.body.style.cursor = "pointer";
              }}
              onPointerOut={() => {
                document.body.style.cursor = "default";
              }}
            >
              <boxGeometry args={[2.1, barHeight, 1.8]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isSelected ? 0.45 : 0.18} metalness={0.12} roughness={0.28} />
            </mesh>

            <Text position={[0, -1.4, 0]} fontSize={0.3} color="#dbeafe" anchorX="center" anchorY="middle">
              {group.group}
            </Text>

            <Text position={[0, barHeight + 0.62, 0]} fontSize={0.24} color="#f8fafc" anchorX="center" anchorY="middle">
              {valueText}
            </Text>

            {isSelected && (
              <mesh position={[0, barHeight / 2 + 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[1.5, 0.08, 12, 100]} />
                <meshStandardMaterial color="#f8fafc" emissive="#f8fafc" emissiveIntensity={0.65} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}

export default BarChartScene;
