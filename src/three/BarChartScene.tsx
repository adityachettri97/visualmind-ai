import { Line, Text } from "@react-three/drei";
import { useDatasetStore } from "../store/datasetStore";
import { useNodeStore } from "../store/nodeStore";
import { summarizeByGroup, formatValue } from "../utils/datasetToGraph";
import { getCurrencySymbolForRegion } from "../utils/currency";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";

const BAR_COLORS = ["#8b5cf6", "#22d3ee", "#a78bfa", "#34d399", "#f59e0b", "#f472b6"];

function BarChartScene() {
  const { data, analysis } = useDatasetStore();
  const { selectedNode, setSelectedNode } = useNodeStore();
  const userRegion = useAuthStore((state) => state.user?.region ?? null);
  const isLightTheme = useThemeStore((state) => state.theme === "light");

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
  const baseline = -1.6;
  const axisX = -(groups.length - 1) * 1.6 - 1.2;
  const axisEndX = (groups.length - 1) * 1.6 + 1.2;
  const axisZ = 1.1;
  const axisColor = isLightTheme ? "#475569" : "#94a3b8";
  const tickTextColor = isLightTheme ? "#0f172a" : "#cbd5e1";

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

            <Text position={[0, -1.4, 0]} fontSize={0.3} color={isLightTheme ? "#1e293b" : "#dbeafe"} anchorX="center" anchorY="middle">
              {group.group}
            </Text>

            <Text position={[0, barHeight + 0.62, 0]} fontSize={0.24} color={isLightTheme ? "#1e293b" : "#f8fafc"} anchorX="center" anchorY="middle">
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
      <Line points={[[axisX, baseline, axisZ], [axisEndX, baseline, axisZ]]} color={axisColor} lineWidth={1} />
      <Line points={[[axisX, baseline, axisZ], [axisX, baseline + 7.3, axisZ]]} color={axisColor} lineWidth={1} />
      {groups.map((group, index) => {
        const x = (index - (groups.length - 1) / 2) * 3.2;

        return (
          <Line
            key={group.group}
            points={[[x, baseline - 0.12, axisZ], [x, baseline + 0.12, axisZ]]}
            color={axisColor}
            lineWidth={1}
          />
        );
      })}
      {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
        const y = baseline + fraction * 7.3;
        const value = maxTotal * fraction;

        return (
          <group key={fraction}>
            <Line points={[[axisX - 0.12, y, axisZ], [axisX + 0.12, y, axisZ]]} color={axisColor} lineWidth={1} />
            <Text position={[axisX - 0.25, y, axisZ]} fontSize={0.28} color={tickTextColor} anchorX="right" anchorY="middle">
              {formatValue(analysis?.valueColumn ?? null, value)}
            </Text>
          </group>
        );
      })}
      <Text
        position={[axisX - 1.6, baseline + 3.65, axisZ]}
        rotation={[0, 0, Math.PI / 2]}
        fontSize={0.32}
        color={tickTextColor}
        anchorX="center"
        anchorY="middle"
      >
        {analysis?.valueColumn ?? "Value"}
      </Text>
      <Text
        position={[(axisX + axisEndX) / 2, baseline - 2.45, axisZ]}
        fontSize={0.32}
        color={tickTextColor}
        anchorX="center"
        anchorY="middle"
      >
        {analysis?.groupColumn ?? "Category"}
      </Text>
    </group>
  );
}

export default BarChartScene;
