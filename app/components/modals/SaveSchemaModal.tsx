"use client";

import React, { useState, useCallback, useEffect } from "react";
import type { Node, Edge } from "@xyflow/react";
import toast from "react-hot-toast";
import useSaveSchemaStore from "@/app/hooks/useSaveSchemaStore";
import usePendingSave from "@/app/hooks/usePendingSave";
import { useSession } from "next-auth/react";
import useLoginModal from "@/app/hooks/useLoginModal";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import Modal from "./Modal";
import { Save, Upload, Download, Loader2 } from "lucide-react";

interface SaveSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: Node[];
  edges: Edge[];
  onLoadSchema: (nodes: Node[], edges: Edge[]) => void;
}

const SaveSchemaModal: React.FC<SaveSchemaModalProps> = ({
  isOpen,
  onClose,
  nodes,
  edges,
  onLoadSchema,
}) => {
  const { data: session } = useSession();
  const loginModal = useLoginModal();
  const {
    saveSchema,
    loadSchema,
    isSaving,
    isLoading,
    schemas,
    currentSchemaId,
  } = useSaveSchemaStore();
  const { 
    pendingName, 
    pendingDescription, 
    setPendingSave, 
    getPendingSave, 
    clearPendingSave 
  } = usePendingSave();

  const [mode, setMode] = useState<"save" | "load">("save");
  const [schemaName, setSchemaName] = useState("");
  const [schemaDescription, setSchemaDescription] = useState("");
  const [selectedSchemaId, setSelectedSchemaId] = useState<string | null>(null);
  const [isAttemptingSave, setIsAttemptingSave] = useState(false);

  // Handle post-login save
  useEffect(() => {
    if (session?.user && isAttemptingSave) {
      const pendingSave = getPendingSave();
      console.log("[SaveSchemaModal] Post-login save triggered", { pendingSave, isAttemptingSave });
      
      if (pendingSave) {
        // Perform the save
        (async () => {
          try {
            if (pendingSave.nodes.length === 0) {
              toast.error("Cannot save an empty schema");
              setIsAttemptingSave(false);
              return;
            }

            await saveSchema(pendingSave.name, pendingSave.description, pendingSave.nodes, pendingSave.edges);
            toast.success("Schema saved successfully!");
            
            // Clear the form and pending save
            setSchemaName("");
            setSchemaDescription("");
            clearPendingSave();
            setIsAttemptingSave(false);
            
            // Close the modal
            onClose();
          } catch (error: any) {
            console.error("[SaveSchemaModal] Post-login save error", error);
            toast.error(error.message || "Failed to save schema");
            setIsAttemptingSave(false);
          }
        })();
      }
    }
  }, [session?.user, isAttemptingSave, getPendingSave, saveSchema, onClose, clearPendingSave]);

  const handleSaveSchema = useCallback(async () => {
    if (!schemaName.trim()) {
      toast.error("Please enter a schema name");
      return;
    }

    // If user is logged in, save immediately
    if (session?.user) {
      try {
        if (nodes.length === 0) {
          toast.error("Cannot save an empty schema");
          return;
        }

        await saveSchema(schemaName, schemaDescription, nodes, edges);
        toast.success("Schema saved successfully!");
        
        // Clear the form and pending save
        setSchemaName("");
        setSchemaDescription("");
        clearPendingSave();
        
        // Close the modal
        onClose();
      } catch (error: any) {
        toast.error(error.message || "Failed to save schema");
      }
    } else {
      // Store the save data
      setPendingSave(schemaName, schemaDescription, nodes, edges);
      setIsAttemptingSave(true);
      // Close save modal before opening login modal
      onClose();
      // Open login modal after a brief delay to allow modal to close
      setTimeout(() => {
        loginModal.onOpen();
      }, 300);
    }
  }, [
    session?.user,
    schemaName,
    schemaDescription,
    nodes,
    edges,
    setPendingSave,
    clearPendingSave,
    onClose,
    loginModal,
    saveSchema,
  ]);

  const handleLoadSchema = useCallback(async () => {
    if (!selectedSchemaId) {
      toast.error("Please select a schema");
      return;
    }

    try {
      const data = await loadSchema(selectedSchemaId);
      onLoadSchema(data.nodes, data.edges);
      toast.success(`Loaded schema: ${data.schema.name}`);
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    }
  }, [selectedSchemaId, loadSchema, onLoadSchema, onClose]);

  const saveBody = (
    <div className="flex flex-col gap-4">
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-neutral-200">Schema Name</label>
        <Input
          placeholder="e.g., User Management System"
          value={schemaName}
          onChange={(e) => setSchemaName(e.target.value)}
          className="mt-1"
          disabled={isSaving}
          onKeyDown={(e) => {
            if (e.key === "Enter" && schemaName.trim()) {
              handleSaveSchema();
            }
          }}
        />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-neutral-200">
          Description (Optional)
        </label>
        <Input
          placeholder="Add a description for your schema"
          value={schemaDescription}
          onChange={(e) => setSchemaDescription(e.target.value)}
          className="mt-1"
          disabled={isSaving}
        />
      </div>
    </div>
  );

  const loadBody = (
    <div className="flex flex-col gap-4">
      <div className="text-sm text-gray-600">
        Select a schema to load into the editor
      </div>
      <div className="flex flex-col gap-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-2">
        {schemas.length === 0 ? (
          <p className="text-sm text-gray-500 p-4 text-center">
            No saved schemas found
          </p>
        ) : (
          schemas.map((schema) => (
            <button
              key={schema.id}
              onClick={() => setSelectedSchemaId(schema.id)}
              className={`p-3 rounded border-2 text-left transition-all ${
                selectedSchemaId === schema.id
                  ? "border-purple-600 bg-purple-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="font-semibold text-sm text-gray-900">
                {schema.name}
              </div>
              {schema.description && (
                <p className="text-xs text-gray-600 mt-1">
                  {schema.description}
                </p>
              )}
              <div className="flex gap-4 text-xs text-gray-500 mt-2">
                <span>{schema.modelCount || 0} models</span>
                <span>
                  Updated{" "}
                  {new Date(schema.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );

  const handleModeChange = (newMode: "save" | "load") => {
    setMode(newMode);
    if (newMode === "load" && schemas.length === 0) {
      // Load schemas when switching to load mode
      useSaveSchemaStore.getState().loadSchemas();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "save" ? "Save Schema" : "Load Schema"}
      body={
        <div>
          <div className="flex gap-2 mb-4 border-b">
            <button
              onClick={() => handleModeChange("save")}
              className={`px-4 py-2 font-medium text-sm ${
                mode === "save"
                  ? "border-b-2 border-purple-600 text-purple-600"
                  : "text-gray-600 dark:text-white dark:hover:text-neutral-400 hover:text-gray-900"
              }`}
            >
              <Save size={16} className="inline mr-2" />
              Save
            </button>
            <button
              onClick={() => handleModeChange("load")}
              className={`px-4 py-2 font-medium text-sm ${
                mode === "load"
                  ? "border-b-2 border-purple-600 text-purple-600"
                  : "text-gray-600 dark:text-white dark:hover:text-neutral-400 hover:text-gray-900"
              }`}
            >
              <Upload size={16} className="inline mr-2" />
              Load
            </button>
          </div>
          {mode === "save" ? saveBody : loadBody}
        </div>
      }
      actionLabel={
        mode === "save"
          ? isSaving
            ? "Saving..."
            : "Save Schema"
          : isLoading
            ? "Loading..."
            : "Load Schema"
      }
      disabled={
        mode === "save"
          ? isSaving || !schemaName.trim()
          : isLoading || !selectedSchemaId
      }
      onSubmit={mode === "save" ? handleSaveSchema : handleLoadSchema}
      secondaryAction={onClose}
      secondaryActionLabel="Cancel"
    />
  );
};

export default SaveSchemaModal;
