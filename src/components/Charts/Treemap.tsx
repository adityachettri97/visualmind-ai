import { useDatasetStore } from "../../store/datasetStore";
import { useNodeStore } from "../../store/nodeStore";
import { datasetToGraph } from "../../utils/datasetToGraph";
import type { GraphNode } from "../../types/graph";

const MIN_WEIGHT = 0.08;

function Treemap() {
  const { data, analysis } = useDatasetStore();
  const { selectedNode, setSelectedNode } = useNodeStore();

  if (!data || data.length === 0) {
    return <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">Upload a dataset to see a treemap.</div>;
  }

  const nodes = datasetToGraph(data, analysis, "cluster");

  const groupsMap = new Map<string, GraphNode[]>();

  nodes.forEach((node) => {
    const list = groupsMap.get(node.region) ?? [];

    list.push(node);
    groupsMap.set(node.region, list);
  });

  const groupEntries = Array.from(groupsMap.entries()).map(([group, groupNodes]) => ({
    group,
    nodes: groupNodes,
    weight: groupNodes.reduce((sum, node) => sum + Math.max(node.sizeFactor, MIN_WEIGHT), 0),
  }));

  return (
    <div className="glass-scrollbar flex h-full w-full gap-1.5 overflow-x-auto p-3">
      {groupEntries.map((groupEntry) => (
        <div key={groupEntry.group} className="flex min-w-[120px] flex-col gap-1.5" style={{ flexGrow: groupEntry.weight, flexBasis: 0 }}>
          <p className="truncate text-xs font-semibold text-slate-300">{groupEntry.group}</p>

          <div className="flex flex-1 flex-col gap-1.5">
            {groupEntry.nodes.map((node) => (
              <button
                key={node.id}
                onClick={() => setSelectedNode(node)}
                title={`${node.label}: ${node.value}`}
                className={`flex min-h-[36px] items-center justify-center overflow-hidden rounded-md p-2 text-center text-xs font-medium text-white transition hover:brightness-110 ${
                  selectedNode?.id === node.id ? "ring-2 ring-white" : ""
                }`}
                style={{ flexGrow: Math.max(node.sizeFactor, MIN_WEIGHT), flexBasis: 0, backgroundColor: node.color }}
              >
                <span className="truncate">{node.label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default Treemap;
