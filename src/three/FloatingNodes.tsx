import FloatingNode from "./FloatingNode";
import { useDatasetStore } from "../store/datasetStore";
import { useVisualizationStore } from "../store/visualizationStore";
import { useFilterStore, matchesFilters } from "../store/filterStore";
import { datasetToGraph, summarizeByGroup } from "../utils/datasetToGraph";

function FloatingNodes() {
  const { data, analysis } = useDatasetStore();
  const { mode } = useVisualizationStore();
  const { searchQuery, selectedGroups, minValue, maxValue } = useFilterStore();

  const nodes = datasetToGraph(data, analysis, mode);
  const filters = { searchQuery, selectedGroups, minValue, maxValue };

  // Objective, deterministic ranking — computed once here instead of per-node, and instead of
  // relying on the AI response (which can be sampled/approximate for large datasets, and isn't
  // available until the round trip finishes).
  const topPerformerIds = new Set(nodes.filter((node) => node.sizeFactor === 1).map((node) => node.id));
  const bottomPerformerIds = new Set(nodes.filter((node) => node.sizeFactor === 0).map((node) => node.id));

  const notableIds = new Set(
    [...nodes]
      .sort((a, b) => b.sizeFactor - a.sizeFactor)
      .slice(0, 3)
      .filter((node) => !topPerformerIds.has(node.id))
      .map((node) => node.id),
  );

  const topCategory = summarizeByGroup(data, analysis)[0]?.group ?? null;

  return (
    <>
      {nodes
        .filter((node) => matchesFilters(node.label, node.region, node.rawValue, filters))
        .map((node) => (
          <FloatingNode
            key={node.id}
            node={node}
            isTopPerformer={topPerformerIds.has(node.id)}
            isBottomPerformer={bottomPerformerIds.has(node.id)}
            isNotable={notableIds.has(node.id)}
            isTopCategory={topCategory !== null && node.region === topCategory}
          />
        ))}
    </>
  );
}

export default FloatingNodes;
