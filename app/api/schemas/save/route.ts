import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import prismadb from "@/app/libs/prismadb";
import { serializeSchema, validateSchema } from "@/app/libs/schemaSerializer";
import { Node, Edge } from "@xyflow/react";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { schemaName, description, nodes, edges } = await request.json();

    if (!schemaName || !Array.isArray(nodes) || !Array.isArray(edges)) {
      return NextResponse.json(
        {
          error: "Missing required fields: schemaName, nodes, edges",
        },
        { status: 400 }
      );
    }

    // Get user
    const user = await prismadb.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Serialize schema data
    const { models, relations } = serializeSchema(nodes, edges);

    const isValid = validateSchema({ models, relations });
    if (!isValid) {
      console.error("[save] Invalid schema structure:", {
        models,
        relations,
      });
      return NextResponse.json(
        { error: "Invalid schema structure" },
        { status: 400 }
      );
    }

    console.log("[save] Creating schema:", {
      name: schemaName,
      modelsCount: models.length,
      relationsCount: relations.length,
    });

    // Create schema document first
    const schema = await (prismadb as any).databaseSchema.create({
      data: {
        name: schemaName,
        description: description || null,
        userId: user.id,
        lastModifiedBy: user.email,
      },
    });

    // Create models with fields
    const nodeIdToModelId = new Map<string, string>();
    for (const model of models) {
      const createdModel = await (prismadb as any).schemaModel.create({
        data: {
          schemaId: schema.id,
          nodeId: model.nodeId,
          name: model.name,
          position: model.position,
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
      nodeIdToModelId.set(model.nodeId, createdModel.id);
    }

    // Create relations with resolved model IDs
    for (const relation of relations) {
      const sourceModelId = nodeIdToModelId.get(relation.sourceNodeId);
      const targetModelId = nodeIdToModelId.get(relation.targetNodeId);

      if (!sourceModelId || !targetModelId) {
        console.error("[save] Missing model IDs for relation:", relation);
        continue;
      }

      await (prismadb as any).schemaRelation.create({
        data: {
          schemaId: schema.id,
          edgeId: relation.edgeId,
          sourceModelId,
          targetModelId,
          relationType: relation.relationType,
        },
      });
    }

    return NextResponse.json(
      {
        message: "Schema saved successfully",
        schemaId: schema.id,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[save] Save schema error:", {
      message: error.message,
      stack: error.stack,
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
