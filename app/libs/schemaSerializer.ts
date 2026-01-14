import { Node, Edge } from "@xyflow/react";

/**
 * Converts React Flow nodes and edges into MongoDB-storable schema data
 */
export function serializeSchema(nodes: Node[], edges: Edge[]) {
  const models = nodes
    .filter((node) => node.type === "entity")
    .map((node) => ({
      nodeId: node.id,
      name: node.data?.name || "Unnamed",
      position: {
        x: node.position?.x || 0,
        y: node.position?.y || 0,
      },
      fields: Array.isArray(node.data?.attributes)
        ? node.data.attributes.map((attr: any) => ({
            name: attr.name || "",
            type: attr.type || "String",
            isOptional: attr.constraint?.type === "optional" || !attr.constraint?.type,
            isList: attr.constraint?.type === "list" || attr.constraint?.list || false,
            constraints: buildConstraints(attr),
            defaultValue: attr.constraint?.value || attr.default || null,
          }))
        : [],
    }));

  const relations = edges
    .filter((edge) => edge.type === "relation")
    .map((edge) => ({
      edgeId: edge.id,
      sourceNodeId: edge.source,
      targetNodeId: edge.target,
      relationType: edge.data?.type || "1-m",
    }));

  return { models, relations };
}

/**
 * Converts MongoDB schema data back into React Flow nodes and edges
 */
export function deserializeSchema(data: any) {
  // Build a map of nodeId to model for relation linking
  const nodeIdToModel = new Map();

  const nodes: Node[] = data.models.map((model: any) => {
    const node: Node = {
      id: model.nodeId,
      type: "entity",
      position: {
        x: model.position?.x || 0,
        y: model.position?.y || 0,
      },
      data: {
        name: model.name,
        attributes: model.fields.map((field: any) => ({
          name: field.name,
          type: field.type,
          constraint: {
            type: field.isOptional ? "optional" : field.isList ? "list" : "required",
            value: field.defaultValue,
          },
        })),
        open: true,
      },
    };
    nodeIdToModel.set(model.nodeId, model);
    return node;
  });

  const edges: Edge[] = data.relations.map((relation: any) => ({
    id: relation.edgeId,
    source: relation.sourceNodeId,
    target: relation.targetNodeId,
    type: "relation",
    data: {
      type: relation.relationType,
    },
  }));

  return { nodes, edges };
}

/**
 * Builds constraint objects from field attributes
 */
function buildConstraints(attr: any): any[] {
  const constraints: any[] = [];

  if (attr.constraint?.type === "Is Id") {
    constraints.push({ type: "id" });
  }
  if (attr.constraint?.type === "unique") {
    constraints.push({ type: "unique" });
  }
  if (attr.constraint?.type === "updatedat") {
    constraints.push({ type: "updatedAt" });
  }
  if (attr.constraint?.value && attr.constraint?.type === "default") {
    constraints.push({ type: "default", value: attr.constraint.value });
  }

  return constraints;
}

/**
 * Validates that serialized schema has required fields
 */
export function validateSchema(data: any): boolean {
  if (!Array.isArray(data.models) || !Array.isArray(data.relations)) {
    return false;
  }

  // Each model must have required fields
  const modelsValid = data.models.every((model: any) => {
    return (
      model.nodeId &&
      model.name &&
      model.position &&
      typeof model.position.x === "number" &&
      typeof model.position.y === "number" &&
      Array.isArray(model.fields)
    );
  });

  // Each relation must reference existing models
  if (!modelsValid) return false;

  const nodeIds = new Set(data.models.map((m: any) => m.nodeId));
  const relationsValid = data.relations.every((rel: any) => {
    return (
      rel.edgeId &&
      nodeIds.has(rel.sourceNodeId) &&
      nodeIds.has(rel.targetNodeId) &&
      rel.relationType
    );
  });

  return relationsValid;
}
