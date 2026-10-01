import { useDatasetStore } from "../../store/datasetStore";
import { useNodeStore } from "../../store/nodeStore";
import { datasetToGraph } from "../../utils/datasetToGraph";
import { useThemeStore } from "../../store/themeStore";

function Heatmap() {
  const { data, analysis } = useDatasetStore();
  const { selectedNode, setSelectedNode } = useNodeStore();
  const isLightTheme = useThemeStore((state) => state.theme === "light");

  if (!data || data.length === 0) {
    return <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">Upload a dataset to see a heatmap.</div>;
  }

  const nodes = datasetToGraph(data, analysis, "cluster");

  return (
    <div
      className="glass-scrollbar grid h-full w-full auto-rows-fr gap-2 overflow-y-auto p-4"
      style={{ gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))" }}
    >
      {nodes.map((node) => {
        const intensity = 0.18 + node.sizeFactor * 0.82;

        return (
          <button
            key={node.id}
            onClick={() => setSelectedNode(node)}
            title={`${node.label}: ${node.value}`}
            className={`flex min-h-[64px] flex-col items-center justify-center rounded-lg p-2 text-center transition hover:scale-[1.03] ${
              selectedNode?.id === node.id ? "ring-2 ring-white" : ""
            }`}
            style={{ backgroundColor: node.color, opacity: intensity }}
          >
            <span className={`w-full truncate text-xs font-semibold ${isLightTheme ? "text-slate-900" : "text-white"}`}>{node.label}</span>

            <span className={`w-full truncate text-[10px] ${isLightTheme ? "text-slate-800" : "text-white/80"}`}>{node.value}</span>
          </button>
        );
      })}
    </div>
  );
}

export default Heatmap;
