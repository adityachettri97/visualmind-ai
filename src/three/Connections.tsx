import Connection from "./Connection";
import { useDatasetStore } from "../store/datasetStore";
import { useVisualizationStore } from "../store/visualizationStore";
import { useFilterStore, isFilterActive, matchesFilters } from "../store/filterStore";
import { datasetToGraph } from "../utils/datasetToGraph";
import type { GraphNode } from "../types/graph";

// Force/Scatter positions come from physics relaxation or randomized placement — they have no
// relationship to original dataset row order, so connecting "array-adjacent" rows (as this used
// to) draws essentially arbitrary lines: some nodes link to something far away, while their
// actual nearest neighbor gets no line at all. Connecting each node to its true nearest neighbor
// is meaningful in every layout mode and means virtually every node ends up connected to
// something, instead of only whichever rows happened to land next to each other in the CSV.
const MAX_TOTAL_CONNECTIONS = 120;

function distance(a: GraphNode, b: GraphNode): number {
  const dx = a.position[0] - b.position[0];
  const dy = a.position[1] - b.position[1];
  const dz = a.position[2] - b.position[2];

  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/** Each node paired with its closest same-group neighbor, deduplicated (A-B kept once, not twice). */
function nearestNeighborPairs(groupNodes: GraphNode[]): [GraphNode, GraphNode][] {
  const seen = new Set<string>();
  const pairs: [GraphNode, GraphNode][] = [];

  groupNodes.forEach((node) => {
    let nearestIndex = -1;
    let nearestDistance = Infinity;

    for (let i = 0; i < groupNodes.length; i++) {
      if (groupNodes[i].id === node.id) continue;

      const dist = distance(node, groupNodes[i]);

      if (dist < nearestDistance) {
        nearestDistance = dist;
        nearestIndex = i;
      }
    }

    if (nearestIndex === -1) return;

    const nearest = groupNodes[nearestIndex];
    const key = node.id < nearest.id ? `${node.id}-${nearest.id}` : `${nearest.id}-${node.id}`;

    if (!seen.has(key)) {
      seen.add(key);
      pairs.push([node, nearest]);
    }
  });

  return pairs;
}

function Connections() {
  const { data, analysis } = useDatasetStore();
  const { mode } = useVisualizationStore();
  const { searchQuery, selectedGroups, minValue, maxValue } = useFilterStore();

  // No uploaded dataset yet
  if (!data || data.length === 0) {
    return null;
  }

  const filters = { searchQuery, selectedGroups, minValue, maxValue };
  const filterActive = isFilterActive(filters);

  function nodeMatches(node: GraphNode): boolean {
    return matchesFilters(node.label, node.region, node.rawValue, filters);
  }

  const graphNodes = datasetToGraph(data, analysis, mode);

  // Group nodes by region
  const regionGroups: Record<string, GraphNode[]> = {};

  graphNodes.forEach((node) => {
    const region = node.region;

    if (!regionGroups[region]) {
      regionGroups[region] = [];
    }

    regionGroups[region].push(node);
  });

  const allPairs = Object.values(regionGroups).flatMap((nodes) => (nodes.length > 1 ? nearestNeighborPairs(nodes) : []));

  const sampledPairs =
    allPairs.length <= MAX_TOTAL_CONNECTIONS
      ? allPairs
      : Array.from({ length: MAX_TOTAL_CONNECTIONS }, (_, i) => allPairs[Math.floor((i * allPairs.length) / MAX_TOTAL_CONNECTIONS)]);

  return (
    <>
      {sampledPairs.map(([node, neighbor]) => {
        const dimmed = filterActive && !(nodeMatches(node) && nodeMatches(neighbor));

        return <Connection key={`${node.id}-${neighbor.id}`} points={[node.position, neighbor.position]} dimmed={dimmed} />;
      })}
    </>
  );
}

export default Connections;
