import { create } from "zustand";
import type { Node, Edge } from "@xyflow/react";

interface PendingSaveState {
  pendingName: string | null;
  pendingDescription: string | null;
  pendingNodes: Node[] | null;
  pendingEdges: Edge[] | null;
  
  // Set pending save data
  setPendingSave: (name: string, description: string, nodes: Node[], edges: Edge[]) => void;
  // Get and clear pending save data
  getPendingSave: () => {
    name: string;
    description: string;
    nodes: Node[];
    edges: Edge[];
  } | null;
  // Clear pending save
  clearPendingSave: () => void;
}

const usePendingSave = create<PendingSaveState>((set, get) => ({
  pendingName: null,
  pendingDescription: null,
  pendingNodes: null,
  pendingEdges: null,
  
  setPendingSave: (name, description, nodes, edges) => {
    set({
      pendingName: name,
      pendingDescription: description,
      pendingNodes: nodes,
      pendingEdges: edges,
    });
  },
  
  getPendingSave: () => {
    const state = get();
    if (!state.pendingName || !state.pendingNodes || !state.pendingEdges) {
      return null;
    }
    return {
      name: state.pendingName,
      description: state.pendingDescription || "",
      nodes: state.pendingNodes,
      edges: state.pendingEdges,
    };
  },
  
  clearPendingSave: () => {
    set({
      pendingName: null,
      pendingDescription: null,
      pendingNodes: null,
      pendingEdges: null,
    });
  },
}));

export default usePendingSave;
