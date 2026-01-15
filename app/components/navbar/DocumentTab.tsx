"use client";

import { Plus, File, ChevronDown, Save, Loader2 } from "lucide-react";
import { useState } from "react";
import { useSession } from "next-auth/react";
import useCreateSchemaModal from "@/app/hooks/useCreateSchemaModal";
import useOpenDocumentModal from "@/app/hooks/useOpenDocumentModal";
import useLoginModal from "@/app/hooks/useLoginModal";
import useSaveSchemaStore from "@/app/hooks/useSaveSchemaStore";
import useCanvasStore from "@/app/hooks/useCanvasStore";
import toast from "react-hot-toast";

const Search = () => {
  const { data: session } = useSession();
  const createSchemaModal = useCreateSchemaModal();
  const openDocumentModal = useOpenDocumentModal();
  const loginModal = useLoginModal();
  const { currentSchemaId, schemas, isSaving: isAutosaving } = useSaveSchemaStore();
  const { nodes, edges } = useCanvasStore();
  const [isManualSaving, setIsManualSaving] = useState(false);

  // Get the current schema name
  const currentSchema = schemas.find((schema) => schema.id === currentSchemaId);
  const fileName = currentSchema?.name || "Untitled";

  const isSaving = isAutosaving || isManualSaving;

  const handleCreateClick = () => {
    if (!session?.user) {
      toast.error("Please login to create a schema");
      loginModal.onOpen();
      return;
    }
    createSchemaModal.onOpen();
  };

  const handleOpenClick = () => {
    if (!session?.user) {
      toast.error("Please login to open documents");
      loginModal.onOpen();
      return;
    }
    openDocumentModal.onOpen();
  };

  const handleSave = async () => {
    if (!currentSchemaId) {
      toast.error("No schema loaded. Please create a schema first.");
      return;
    }

    setIsManualSaving(true);
    try {
      console.debug("[manual-save] payload", {
        schemaId: currentSchemaId,
        nodesLength: nodes.length,
        edgesLength: edges.length,
      });

      // Use autosave endpoint to update existing schema
      const response = await fetch(`/api/schemas/autosave/${currentSchemaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nodes,
          edges,
        }),
      });

      const responseBody = await response
        .clone()
        .json()
        .catch(() => ({ message: "<non-JSON body>" }));

      console.debug("[manual-save] response", {
        status: response.status,
        ok: response.ok,
        body: responseBody,
      });

      if (!response.ok) {
        throw new Error(responseBody.error || "Failed to save schema");
      }

      toast.success("Schema saved successfully!");
    } catch (error: any) {
      if (error?.name === "AbortError") return; // ignore cancelled saves
      toast.error(error.message || "Failed to save schema");
    } finally {
      setIsManualSaving(false);
    }
  };

  return (
      <div className="flex flex-row items-center gap-2">
        {/* Inner pill: Save/AutoSave */}
        <button
          className="
            flex items-center gap-2
            px-4 py-2
            rounded-full
          hover:bg-purple-500
            text-sm font-semibold
            bg-purple-600
            text-white
            transition shadow-sm hover:shadow-md border-[1px] border-neutral-200 cursor-pointer
            disabled:opacity-50 disabled:cursor-not-allowed
          "
          onClick={handleSave}
          disabled={!currentSchemaId || isSaving}
        >
          {isSaving ? (
            <Loader2 size={18} className="h-6 w-6 text-white rounded-sm animate-spin" />
          ) : (
            <Save size={18} className="h-6 w-6 text-white rounded-sm" />
          )}
          {isSaving ? "Saving..." : "Save"}
        </button>
        {/* Inner pill: Create */}
        <button
          className="
            flex items-center gap-2
            px-4 py-2
            rounded-full
          hover:bg-gray-50
            text-sm font-semibold
            transition shadow-sm hover:shadow-md border-[1px] border-neutral-200 cursor-pointer
          "
          onClick={handleCreateClick}
        >
          <Plus size={18} className="h-6 w-6 text-white rounded-full bg-purple-600" />
          Create
        </button>

        {/* Inner pill: File name */}
        <button
          className="
            flex items-center gap-2
            px-4 py-2
            rounded-full
            bg-gray-100 hover:bg-gray-50
            text-sm font-semibold
            transition shadow-sm hover:shadow-md border-[1px] border-neutral-200 cursor-pointer
          "
          onClick={handleOpenClick}
        >
          <File size={18} />
          {fileName}
          <ChevronDown size={16} />
        </button>
      </div>
  );
};

export default Search;
