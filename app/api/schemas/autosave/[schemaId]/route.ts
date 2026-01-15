import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import prismadb from "@/app/libs/prismadb";
import { serializeSchema, validateSchema } from "@/app/libs/schemaSerializer";
import { Node, Edge } from "@xyflow/react";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ schemaId: string }> }
) {
  try {
    const { schemaId } = await context.params;

    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prismadb.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    const schema = await (prismadb as any).databaseSchema.findFirst({
      where: {
        id: schemaId,
        userId: user.id,
      },
      include: {
        models: {
          include: {
            fields: true,
          },
        },
        relations: true,
      },
    });

    if (!schema) {
      return NextResponse.json(
        { error: "Schema not found" },
        { status: 404 }
      );
    }

    const { nodes, edges } = await request.json();

    if (!Array.isArray(nodes) || !Array.isArray(edges)) {
      return NextResponse.json(
        { error: "Invalid nodes or edges" },
        { status: 400 }
      );
    }

    // Serialize schema data
    const { models: newModels, relations: newRelations } = serializeSchema(
      nodes,
      edges
    );

    // Validate schema structure
    const isValid = validateSchema({ models: newModels, relations: newRelations });
    if (!isValid) {
      console.error("[autosave] Invalid schema structure:", {
        models: newModels,
        relations: newRelations,
      });
      return NextResponse.json(
        { error: "Invalid schema structure" },
        { status: 400 }
      );
    }

    console.log("[autosave] Serialized schema:", {
      modelsCount: newModels.length,
      relationsCount: newRelations.length,
      modelNodeIds: newModels.map(m => m.nodeId),
      relationEdgeIds: newRelations.map(r => r.edgeId),
    });

    // Delete existing models and relations
    await (prismadb as any).schemaModel.deleteMany({
      where: { schemaId },
    });

    await (prismadb as any).schemaRelation.deleteMany({
      where: { schemaId },
    });

    // Create new models and fields
    const modelNodeIdMap: Record<string, string> = {};
    for (const model of newModels) {
      const createdModel = await (prismadb as any).schemaModel.create({
        data: {
          schemaId,
          name: model.name,
          nodeId: model.nodeId,
          position: {
            x: model.position?.x || 0,
            y: model.position?.y || 0,
          },
          fields: {
            create: model.fields.map((field: any) => ({
              name: field.name,
              type: field.type,
              isOptional: field.isOptional ?? true,
              isList: field.isList ?? false,
              constraints: field.constraints || [],
              defaultValue: field.defaultValue || null,
            })),
          },
        },
      });
      modelNodeIdMap[model.nodeId] = createdModel.id;
    }

    // Create new relations with resolved model IDs
    for (const relation of newRelations) {
      const sourceModelId = modelNodeIdMap[relation.sourceNodeId];
      const targetModelId = modelNodeIdMap[relation.targetNodeId];

      if (!sourceModelId || !targetModelId) {
        console.error("Missing model IDs for relation:", relation);
        continue; // Skip invalid relations
      }

      await (prismadb as any).schemaRelation.create({
        data: {
          schemaId,
          edgeId: relation.edgeId,
          sourceModelId,
          targetModelId,
          relationType: relation.relationType,
        },
      });
    }

    // Update schema's updatedAt timestamp
    const updatedSchema = await (prismadb as any).databaseSchema.update({
      where: { id: schemaId },
      data: {
        updatedAt: new Date(),
        lastModifiedBy: user.email,
      },
    });

    return NextResponse.json(
      {
        message: "Schema saved successfully",
        schemaId: updatedSchema.id,
        updatedAt: updatedSchema.updatedAt,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[autosave] Save schema error:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    return NextResponse.json(
      { 
        error: "Failed to save schema",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
