"use client";

import React, { useCallback, useState } from "react";
import type { Node, Edge } from "@xyflow/react";
import Modal from "./Modal";
import useCreateSchemaModal from "@/app/hooks/useCreateSchemaModal";
import { placeholderData } from "@/app/libs/constants";
import useSaveSchemaStore from "@/app/hooks/useSaveSchemaStore";
import type { Entity, Relation } from "@/app/libs/types";
import toast from "react-hot-toast";

interface SchemaOption {
  id: "blank" | "example";
  title: string;
  description: string;
  icon: string;
}

interface CreateSchemaModalProps {
  onSchemaCreate: (nodes: Node[], edges: Edge[]) => void;
}

const schemaOptions: SchemaOption[] = [
  {
    id: "blank",
    title: "Blank Schema",
    description: "Start with an empty canvas and build your schema from scratch",
    icon: "📄",
  },
  {
    id: "example",
    title: "Example Schema",
    description: "Start with a pre-built User & Task schema example",
    icon: "✨",
  },
];

const CreateSchemaModal: React.FC<CreateSchemaModalProps> = ({ onSchemaCreate }) => {
  const { isOpen, onClose } = useCreateSchemaModal();
  const { saveSchema, setCurrentSchemaId } = useSaveSchemaStore();
  const [selectedOption, setSelectedOption] = useState<"blank" | "example" | null>(null);
  const [step, setStep] = useState<"select" | "name">("select");
  const [schemaName, setSchemaName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectOption = useCallback((optionId: "blank" | "example") => {
    setSelectedOption(optionId);
    setStep("name");
  }, []);

  const generateSchemaData = useCallback((option: "blank" | "example"): [Node[], Edge[]] => {
    if (option === "blank") {
      return [[], []];
    } else {
      // Create example schema with pre-populated data
      const newNodes = placeholderData.entities.map((entity: Entity, index: number) => ({
        id: `${index}`,
        position: { x: 375 + index * 500, y: 80 + index * 360 },
        data: { name: entity.name, attributes: entity.attributes, open: true },
        type: "entity",
      } as Node));

      // Create edges from relations
      const newEdges = placeholderData.relations
        .map((relation: Relation, index: number) => {
          const from = newNodes.find((node) => node.data.name === relation.from);
          const to = newNodes.find((node) => node.data.name === relation.to);
          if (!from || !to) return null;

          return {
            id: `${index}`,
            source: from.id,
            target: to.id,
            type: "relation",
            data: { type: relation.type },
          } as Edge;
        })
        .filter((edge): edge is Edge => edge !== null);

      return [newNodes, newEdges];
    }
  }, []);

  const handleCreateAndSave = useCallback(async () => {
    if (!selectedOption || !schemaName.trim()) {
      toast.error("Please enter a schema name");
      return;
    }

    setIsLoading(true);
    try {
      const [nodes, edges] = generateSchemaData(selectedOption);

      // Save schema to database immediately
      const schemaId = await saveSchema(schemaName.trim(), description.trim(), nodes, edges);

      // Set current schema ID in store for autosave
      setCurrentSchemaId(schemaId);

      // Populate canvas with the data
      onSchemaCreate(nodes, edges);

      // Show success message
      toast.success(`Schema "${schemaName}" created successfully!`);

      // Close modal and reset state
      onClose();
      setSelectedOption(null);
      setStep("select");
      setSchemaName("");
      setDescription("");
    } catch (error: any) {
      toast.error(error.message || "Failed to create schema");
    } finally {
      setIsLoading(false);
    }
  }, [selectedOption, schemaName, description, generateSchemaData, saveSchema, setCurrentSchemaId, onSchemaCreate, onClose]);

  const handleBackToSelect = useCallback(() => {
    setStep("select");
    setSelectedOption(null);
    setSchemaName("");
    setDescription("");
  }, []);

  const selectBody = (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-gray-600 mb-4">
        Choose how you'd like to start your database schema
      </p>
      <div className="grid grid-cols-2 gap-4">
        {schemaOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => handleSelectOption(option.id)}
            className={`
              p-4 rounded-lg border-2 transition-all duration-200
              flex flex-col items-center gap-3 text-center
              hover:shadow-md
              ${
                selectedOption === option.id
                  ? "border-purple-600 bg-purple-50 shadow-md"
                  : "border-neutral-200 bg-white hover:border-neutral-300"
              }
            `}
          >
            <div className="text-3xl">{option.icon}</div>
            <h3 className="font-semibold text-gray-900">{option.title}</h3>
            <p className="text-xs text-gray-600">{option.description}</p>
          </button>
        ))}
      </div>
    </div>
  );

  const nameBody = (
    <div className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Schema Name *
        </label>
        <input
          type="text"
          value={schemaName}
          onChange={(e) => setSchemaName(e.target.value)}
          placeholder="e.g., Blog Database, E-commerce Store"
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
          disabled={isLoading}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleCreateAndSave();
            }
          }}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description (optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add a description for your schema..."
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent resize-none h-20"
          disabled={isLoading}
        />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-800">
          <strong>📌 Note:</strong> Your schema will be automatically saved to the database and autosave will start immediately when you begin editing.
        </p>
      </div>
    </div>
  );

  const body = step === "select" ? selectBody : nameBody;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={step === "select" ? () => {} : handleCreateAndSave}
      title={step === "select" ? "Create New Schema" : `Create Schema: ${selectedOption === "blank" ? "Blank" : "Example"}`}
      body={body}
      actionLabel={step === "select" ? "Next" : "Create & Save"}
      disabled={step === "select" ? !selectedOption : !schemaName.trim() || isLoading}
      secondaryAction={step === "select" ? onClose : handleBackToSelect}
      secondaryActionLabel={step === "select" ? "Cancel" : "Back"}
    />
  );
};

export default CreateSchemaModal;
