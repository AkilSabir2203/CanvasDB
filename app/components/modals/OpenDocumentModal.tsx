"use client";

import React, { useEffect, useState, useCallback } from "react";
import type { Node, Edge } from "@xyflow/react";
import toast from "react-hot-toast";
import useSaveSchemaStore from "@/app/hooks/useSaveSchemaStore";
import useOpenDocumentModal from "@/app/hooks/useOpenDocumentModal";
import useCanvasStore from "@/app/hooks/useCanvasStore";
import Modal from "./Modal";
import { Loader2, Clock, Database, Trash2 } from "lucide-react";

interface OpenDocumentModalProps {
  onLoadSchema: (nodes: Node[], edges: Edge[]) => void;
}

interface SchemaItem {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  lastModifiedBy?: string;
  modelCount?: number;
  relationCount?: number;
}

const OpenDocumentModal: React.FC<OpenDocumentModalProps> = ({
  onLoadSchema,
}) => {
  const { isOpen, onClose } = useOpenDocumentModal();
  const { loadSchema, isLoading, schemas, setCurrentSchemaId, deleteSchema, currentSchemaId } = useSaveSchemaStore();
  const { reset: resetCanvas } = useCanvasStore();
  const [localSchemas, setLocalSchemas] = useState<SchemaItem[]>([]);
  const [selectedSchemaId, setSelectedSchemaId] = useState<string | null>(null);
  const [isLoadingSchema, setIsLoadingSchema] = useState(false);
  const [deletingSchemaId, setDeletingSchemaId] = useState<string | null>(null);

  // Load schemas when modal opens
  useEffect(() => {
    if (isOpen) {
      loadAndDisplaySchemas();
    }
  }, [isOpen]);

  const loadAndDisplaySchemas = async () => {
    try {
      await useSaveSchemaStore.getState().loadSchemas();
      const schemas = useSaveSchemaStore.getState().schemas;
      setLocalSchemas(schemas as SchemaItem[]);
    } catch (error: any) {
      console.error(error);
    }
  };

  const handleSelectSchema = useCallback(
    async (schemaId: string) => {
      setSelectedSchemaId(schemaId);
      setIsLoadingSchema(true);

      try {
        const schemaData = await loadSchema(schemaId);
        setCurrentSchemaId(schemaId);
        onLoadSchema(schemaData.nodes, schemaData.edges);
        toast.success(`Loaded: ${schemaData.schema?.name || "Schema"}`);
        // Reset loading state before closing
        setIsLoadingSchema(false);
        // Automatically close modal after successful load
        onClose();
      } catch (error: any) {
        toast.error(error.message || "Failed to load schema");
        setIsLoadingSchema(false);
      }
    },
    [loadSchema, onLoadSchema, onClose, setCurrentSchemaId]
  );

  const handleDeleteSchema = useCallback(
    async (schemaId: string, schemaName: string, e: React.MouseEvent) => {
      // Prevent triggering the parent button's onClick (load schema)
      e.stopPropagation();

      // Ask for confirmation
      const confirmed = window.confirm(
        `Are you sure you want to delete "${schemaName}"?\n\nThis action cannot be undone.`
      );

      if (!confirmed) return;

      setDeletingSchemaId(schemaId);

      try {
        await deleteSchema(schemaId);
        toast.success(`Deleted: ${schemaName}`);

        // If the deleted schema was currently open, reset to empty state
        if (currentSchemaId === schemaId) {
          setCurrentSchemaId(null);
          resetCanvas();
          onLoadSchema([], []);
        }

        // Refresh the list
        await loadAndDisplaySchemas();
      } catch (error: any) {
        toast.error(error.message || "Failed to delete schema");
      } finally {
        setDeletingSchemaId(null);
      }
    },
    [deleteSchema, currentSchemaId, setCurrentSchemaId, resetCanvas, onLoadSchema]
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
      });
    }
  };

  const body = (
    <div className="flex flex-col gap-4">
      <div className="text-sm text-gray-600">
        {localSchemas.length === 0
          ? "No saved schemas found. Create one using the Create button!"
          : "Click a document to open it"}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-2">
        {localSchemas.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-400">
            <Database size={48} className="mb-4 opacity-50" />
            <p className="text-sm">No documents yet</p>
          </div>
        ) : (
          localSchemas.map((schema) => (
            <div
              key={schema.id}
              className={`relative p-4 rounded-lg border-2 transition-all duration-200 text-left flex flex-col gap-2 ${
                selectedSchemaId === schema.id
                  ? "border-purple-600 bg-purple-50 shadow-md"
                  : "border-gray-200 bg-white hover:border-purple-400 hover:shadow-sm"
              } ${
                isLoadingSchema && selectedSchemaId === schema.id
                  ? "opacity-70"
                  : ""
              }`}
            >
              <button
                onClick={() => handleSelectSchema(schema.id)}
                disabled={isLoadingSchema && selectedSchemaId === schema.id}
                className="absolute inset-0 w-full h-full cursor-pointer z-0"
                aria-label={`Open ${schema.name}`}
              />

              <div className="flex items-start justify-between gap-2 relative z-10">
                <h3 className="font-semibold text-gray-900 flex-1 truncate">
                  {schema.name}
                </h3>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {isLoadingSchema && selectedSchemaId === schema.id && (
                    <Loader2 size={16} className="animate-spin text-purple-600" />
                  )}
                  <button
                    onClick={(e) => handleDeleteSchema(schema.id, schema.name, e)}
                    disabled={deletingSchemaId === schema.id}
                    className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={`Delete ${schema.name}`}
                    title="Delete schema"
                  >
                    {deletingSchemaId === schema.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                </div>
              </div>

              {schema.description && (
                <p className="text-xs text-gray-600 line-clamp-2 relative z-10 pointer-events-none">
                  {schema.description}
                </p>
              )}

              <div className="flex items-center gap-2 text-xs text-gray-500 relative z-10 pointer-events-none">
                <Clock size={12} />
                <span>{formatDate(schema.updatedAt)}</span>
              </div>

              <div className="flex gap-3 text-xs text-gray-500 pt-1 border-t border-gray-100 relative z-10 pointer-events-none">
                <span>{schema.modelCount || 0} models</span>
                <span>{schema.relationCount || 0} relations</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Open Document"
      body={body}
      actionLabel="Close"
      onSubmit={onClose}
      disabled={isLoadingSchema}
    />
  );
};

export default OpenDocumentModal;
