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
        x: node.position?.x ?? 0,
        y: node.position?.y ?? 0,
      },
      fields: Array.isArray(node.data?.attributes)
        ? node.data.attributes.map((attr: any) => {
            const constraints = buildConstraints(attr);
            const isOptional = 
              attr.constraint?.type === "optional" || 
              (!attr.constraint?.type && constraints.length === 0);
            const isList = 
              attr.constraint?.type === "list" || 
              attr.constraint?.list === true;

            return {
              name: attr.name || "",
              type: attr.type || "String",
              isOptional,
              isList,
              constraints,
              defaultValue: attr.constraint?.value || attr.default || null,
            };
          })
        : [],
    }));

  const relations = edges
    .filter((edge) => edge.type === "relation" && edge.source && edge.target)
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

  const nodes: Node[] = (data.models || []).map((model: any) => {
    const node: Node = {
      id: model.nodeId,
      type: "entity",
      position: {
        x: model.position?.x ?? 0,
        y: model.position?.y ?? 0,
      },
      data: {
        name: model.name || "Unnamed",
        attributes: (model.fields || []).map((field: any) => {
          // Determine constraint type from constraints array or field properties
          let constraintType = "optional";
          let constraintValue = field.defaultValue;

          if (Array.isArray(field.constraints) && field.constraints.length > 0) {
            const constraint = field.constraints[0];
            if (constraint.type === "id") {
              constraintType = "Is Id";
            } else if (constraint.type === "unique") {
              constraintType = "unique";
            } else if (constraint.type === "updatedAt") {
              constraintType = "updatedat";
            } else if (constraint.type === "default") {
              constraintType = "default";
              constraintValue = constraint.value;
            }
          } else if (field.isList) {
            constraintType = "list";
          } else if (!field.isOptional) {
            constraintType = "required";
          }

          return {
            name: field.name || "",
            type: field.type || "String",
            constraint: {
              type: constraintType,
              value: constraintValue,
              list: field.isList || false,
            },
          };
        }),
        open: true,
      },
    };
    nodeIdToModel.set(model.nodeId, model);
    return node;
  });

  const edges: Edge[] = (data.relations || []).map((relation: any) => ({
    id: relation.edgeId,
    source: relation.sourceNodeId,
    target: relation.targetNodeId,
    type: "relation",
    data: {
      type: relation.relationType || "1-m",
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
  if (!data || typeof data !== "object") {
    console.error("[validateSchema] Invalid data: not an object");
    return false;
  }

  if (!Array.isArray(data.models)) {
    console.error("[validateSchema] Invalid models: not an array");
    return false;
  }

  if (!Array.isArray(data.relations)) {
    console.error("[validateSchema] Invalid relations: not an array");
    return false;
  }

  // Each model must have required fields
  const modelsValid = data.models.every((model: any, index: number) => {
    const isValid =
      model.nodeId &&
      typeof model.nodeId === "string" &&
      model.name &&
      typeof model.name === "string" &&
      model.position &&
      typeof model.position.x === "number" &&
      typeof model.position.y === "number" &&
      Array.isArray(model.fields);

    if (!isValid) {
      console.error(`[validateSchema] Invalid model at index ${index}:`, {
        nodeId: model.nodeId,
        name: model.name,
        position: model.position,
        hasFields: Array.isArray(model.fields),
      });
    }

    return isValid;
  });

  if (!modelsValid) {
    return false;
  }

  // Each relation must reference existing models
  const nodeIds = new Set(data.models.map((m: any) => m.nodeId));
  const relationsValid = data.relations.every((rel: any, index: number) => {
    const isValid =
      rel.edgeId &&
      typeof rel.edgeId === "string" &&
      rel.sourceNodeId &&
      typeof rel.sourceNodeId === "string" &&
      nodeIds.has(rel.sourceNodeId) &&
      rel.targetNodeId &&
      typeof rel.targetNodeId === "string" &&
      nodeIds.has(rel.targetNodeId) &&
      rel.relationType &&
      typeof rel.relationType === "string";

    if (!isValid) {
      console.error(`[validateSchema] Invalid relation at index ${index}:`, {
        edgeId: rel.edgeId,
        sourceNodeId: rel.sourceNodeId,
        targetNodeId: rel.targetNodeId,
        relationType: rel.relationType,
        sourceExists: nodeIds.has(rel.sourceNodeId),
        targetExists: nodeIds.has(rel.targetNodeId),
      });
    }

    return isValid;
  });

  return relationsValid;
}
