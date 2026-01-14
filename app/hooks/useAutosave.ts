import { useEffect, useRef, useCallback } from "react";
import { Node, Edge } from "@xyflow/react";
import useSaveSchemaStore from "./useSaveSchemaStore";

interface AutosaveConfig {
  enabled: boolean;
  debounceMs?: number;
  onSaving?: () => void;
  onSaved?: () => void;
  onError?: (error: string) => void;
}

export const useAutosave = (
  nodes: Node[],
  edges: Edge[],
  config: AutosaveConfig = { enabled: true, debounceMs: 3000 }
) => {
  const store = useSaveSchemaStore();
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastSavedState = useRef<{
    nodes: string;
    edges: string;
  } | null>(null);
  const isAutosavingRef = useRef(false);

  const debounceMs = config.debounceMs || 3000;

  // Serialize current state to detect changes
  const serializeState = useCallback(() => {
    return {
      nodes: JSON.stringify(nodes),
      edges: JSON.stringify(edges),
    };
  }, [nodes, edges]);

  // Check if schema has changed
  const hasChanges = useCallback(() => {
    const currentState = serializeState();
    if (!lastSavedState.current) {
      return true; // First time, consider it as having changes
    }
    return (
      currentState.nodes !== lastSavedState.current.nodes ||
      currentState.edges !== lastSavedState.current.edges
    );
  }, [serializeState]);

  // Perform autosave
  const performAutosave = useCallback(async () => {
    if (!config.enabled || !store.currentSchemaId || isAutosavingRef.current) {
      return;
    }

    if (!hasChanges()) {
      return; // No changes to save
    }

    isAutosavingRef.current = true;
    config.onSaving?.();

    // Cancel any in-flight autosave (debounced calls should not surface errors)
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      console.debug("[autosave] payload", {
        schemaId: store.currentSchemaId,
        nodesLength: nodes.length,
        edgesLength: edges.length,
      });

      // Use the autosave endpoint specifically designed for this
      const response = await fetch(
        `/api/schemas/autosave/${store.currentSchemaId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nodes,
            edges,
          }),
          signal: controller.signal,
        }
      );

      const responseBody = await response
        .clone()
        .json()
        .catch(() => ({ message: "<non-JSON body>" }));
      console.debug("[autosave] response", {
        status: response.status,
        ok: response.ok,
        body: responseBody,
      });

      if (!response.ok) {
        throw new Error(responseBody.error || "Autosave failed");
      }

      // Update last saved state
      lastSavedState.current = serializeState();
      config.onSaved?.();
    } catch (error: any) {
      if (error?.name === "AbortError") {
        // Ignore aborted autosave attempts (e.g., rapid debounce)
        return;
      }
      console.error("Autosave error:", error);
      config.onError?.(error.message);
      // Silently fail autosave errors to not disturb user
    } finally {
      isAutosavingRef.current = false;
    }
  }, [
    config,
    store.currentSchemaId,
    nodes,
    edges,
    hasChanges,
    serializeState,
  ]);

  // Debounced autosave trigger
  const triggerAutosave = useCallback(() => {
    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer
    debounceTimer.current = setTimeout(() => {
      performAutosave();
    }, debounceMs);
  }, [debounceMs, performAutosave]);

  // Initialize last saved state on mount
  useEffect(() => {
    lastSavedState.current = serializeState();
  }, [serializeState]);

  // Trigger autosave when nodes or edges change
  useEffect(() => {
    if (config.enabled && store.currentSchemaId) {
      triggerAutosave();
    }

    // Cleanup on unmount
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [nodes, edges, config.enabled, store.currentSchemaId, triggerAutosave]);

  return {
    isAutosaving: isAutosavingRef.current,
    performAutosave,
  };
};
