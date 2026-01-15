"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Node, Edge } from "@xyflow/react";

interface CanvasState {
  nodes: Node[];
  edges: Edge[];
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  reset: () => void;
  resetToEmpty: () => void;
}

const useCanvasStore = create<CanvasState>()(
  persist(
    (set) => ({
      nodes: [],
      edges: [],
      setNodes: (nodes: Node[]) => set({ nodes }),
      setEdges: (edges: Edge[]) => set({ edges }),
      reset: () => set({ nodes: [], edges: [] }),
      resetToEmpty: () => set({ nodes: [], edges: [] }),
    }),
    {
      name: "canvas-storage-v1",
      partialize: (state) => ({ nodes: state.nodes, edges: state.edges }),
    }
  )
);

export default useCanvasStore;
