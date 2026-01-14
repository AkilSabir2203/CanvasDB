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

    if (!validateSchema({ models, relations })) {
      return NextResponse.json(
        { error: "Invalid schema structure" },
        { status: 400 }
      );
    }

    // Create schema document with nested data
    const schema = await (prismadb as any).databaseSchema.create({
      data: {
        name: schemaName,
        description: description || null,
        userId: user.id,
        lastModifiedBy: user.email,
        models: {
          create: models.map((model: any) => ({
            nodeId: model.nodeId,
            name: model.name,
            position: model.position,
            fields: {
              create: model.fields.map((field: any) => ({
                name: field.name,
                type: field.type,
                isOptional: field.isOptional,
                isList: field.isList,
                constraints: field.constraints,
                defaultValue: field.defaultValue,
              })),
            },
          })),
        },
        relations: {
          create: relations.map((relation: any, idx: number) => ({
            edgeId: relation.edgeId || `edge-${idx}`,
            sourceModelId: "", // patched later
            targetModelId: "", // patched later
            relationType: relation.relationType,
          })),
        },
      },
      include: {
        models: { include: { fields: true } },
        relations: true,
      },
    });

    // Patch relations with correct model IDs
    const nodeIdToModelId = new Map<string, string>();
    schema.models.forEach((model: any) => {
      nodeIdToModelId.set(model.nodeId, model.id);
    });

    await Promise.all(
      relations.map((relation: any, idx: number) => {
        const sourceModelId = nodeIdToModelId.get(relation.sourceNodeId);
        const targetModelId = nodeIdToModelId.get(relation.targetNodeId);

        if (!sourceModelId || !targetModelId) return Promise.resolve();

        return (prismadb as any).schemaRelation.updateMany({
          where: {
            schemaId: schema.id,
            edgeId: relation.edgeId || `edge-${idx}`,
          },
          data: {
            sourceModelId,
            targetModelId,
          },
        });
      })
    );

    return NextResponse.json(
      {
        message: "Schema saved successfully",
        schemaId: schema.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Save schema error:", error);
    return NextResponse.json(
      { error: "Failed to save schema" },
      { status: 500 }
    );
  }
}
