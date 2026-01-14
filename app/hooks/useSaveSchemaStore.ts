import { create } from "zustand";

interface SavedSchema {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  lastModifiedBy?: string;
  modelCount?: number;
  relationCount?: number;
}

interface SaveSchemaStore {
  isLoading: boolean;
  isSaving: boolean;
  schemas: SavedSchema[];
  currentSchemaId: string | null;
  
  // Schema operations
  saveSchema: (schemaName: string, description: string, nodes: any[], edges: any[]) => Promise<string>;
  loadSchema: (schemaId: string) => Promise<{ nodes: any[]; edges: any[]; schema: any }>;
  loadSchemas: () => Promise<void>;
  deleteSchema: (schemaId: string) => Promise<void>;
  updateSchemaMetadata: (schemaId: string, name: string, description: string) => Promise<void>;
  
  // State management
  setCurrentSchemaId: (schemaId: string | null) => void;
}

const useSaveSchemaStore = create<SaveSchemaStore>((set, get) => ({
  isLoading: false,
  isSaving: false,
  schemas: [],
  currentSchemaId: null,
  
  setCurrentSchemaId: (schemaId) => set({ currentSchemaId: schemaId }),
  
  saveSchema: async (schemaName, description, nodes, edges) => {
    set({ isSaving: true });
    try {
      const response = await fetch("/api/schemas/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schemaName,
          description,
          nodes,
          edges,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save schema");
      }

      const data = await response.json();
      set({ currentSchemaId: data.schemaId });
      
      // Refresh schemas list
      await get().loadSchemas();
      
      return data.schemaId;
    } finally {
      set({ isSaving: false });
    }
  },
  
  loadSchema: async (schemaId) => {
    set({ isLoading: true });
    try {
      const response = await fetch(`/api/schemas/${schemaId}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to load schema");
      }

      const data = await response.json();
      set({ currentSchemaId: schemaId });
      return data.schema;
    } finally {
      set({ isLoading: false });
    }
  },
  
  loadSchemas: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch("/api/schemas/list");

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to load schemas");
      }

      const data = await response.json();
      set({ schemas: data.schemas });
    } finally {
      set({ isLoading: false });
    }
  },
  
  deleteSchema: async (schemaId) => {
    try {
      const response = await fetch(`/api/schemas/delete/${schemaId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete schema");
      }

      // Refresh schemas list
      await get().loadSchemas();
      
      if (get().currentSchemaId === schemaId) {
        set({ currentSchemaId: null });
      }
    } catch (error) {
      throw error;
    }
  },
  
  updateSchemaMetadata: async (schemaId, name, description) => {
    try {
      const response = await fetch(`/api/schemas/delete/${schemaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update schema");
      }

      // Refresh schemas list
      await get().loadSchemas();
    } catch (error) {
      throw error;
    }
  },
}));

export default useSaveSchemaStore;
