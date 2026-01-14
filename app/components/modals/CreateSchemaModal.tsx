"use client";

import React, { useCallback, useState } from "react";
import type { Node, Edge } from "@xyflow/react";
import Modal from "./Modal";
import useCreateSchemaModal from "@/app/hooks/useCreateSchemaModal";
import { placeholderData } from "@/app/libs/constants";
import type { Entity, Relation } from "@/app/libs/types";

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
  const [selectedOption, setSelectedOption] = useState<"blank" | "example" | null>(null);

  const handleCreateSchema = useCallback(() => {
    if (!selectedOption) return;

    if (selectedOption === "blank") {
      // Create blank schema
      onSchemaCreate([], []);
    } else if (selectedOption === "example") {
      // Create example schema with pre-populated data - matching DownloadButton.tsx style
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

      onSchemaCreate(newNodes, newEdges);
    }

    // Close modal and reset selection
    onClose();
    setSelectedOption(null);
  }, [selectedOption, onSchemaCreate, onClose]);

  const body = (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-gray-600 mb-4">
        Choose how you'd like to start your database schema
      </p>
      <div className="grid grid-cols-2 gap-4">
        {schemaOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => setSelectedOption(option.id)}
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleCreateSchema}
      title="Create New Schema"
      body={body}
      actionLabel="Create"
      disabled={false}
      secondaryAction={onClose}
      secondaryActionLabel="Cancel"
    />
  );
};

export default CreateSchemaModal;
