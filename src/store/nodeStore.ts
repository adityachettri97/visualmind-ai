import { create } from "zustand";

import type { GraphNode } from "../types/graph";

interface NodeStore {
  selectedNode: GraphNode | null;

  setSelectedNode: (node: GraphNode | null) => void;
}
// export interface SelectedNode {
//   label: string;
//   color: string;
//   position: [number, number, number];
// }

// interface NodeStore {
//   selectedNode: SelectedNode | null;
//   setSelectedNode: (node: SelectedNode | null) => void;
// }

export const useNodeStore = create<NodeStore>((set) => ({
  selectedNode: null,

  setSelectedNode: (node) =>
    set({
      selectedNode: node,
    }),
}));
