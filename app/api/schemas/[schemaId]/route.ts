import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import prismadb from "@/app/libs/prismadb";
import { deserializeSchema } from "@/app/libs/schemaSerializer";

export async function GET(
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

    // Fetch schema with all relationships
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

    // Transform relations to use nodeId instead of modelId
    const transformedRelations = (schema.relations || [])
      .map((rel: any) => {
        const sourceModel = schema.models.find(
          (m: any) => m.id === rel.sourceModelId
        );
        const targetModel = schema.models.find(
          (m: any) => m.id === rel.targetModelId
        );

        if (!sourceModel || !targetModel) {
          console.warn("[load-schema] Skipping relation with missing models:", {
            relationId: rel.id,
            sourceModelId: rel.sourceModelId,
            targetModelId: rel.targetModelId,
          });
          return null;
        }

        return {
          edgeId: rel.edgeId || rel.id, // Fallback to relation ID if edgeId missing
          sourceNodeId: sourceModel.nodeId,
          targetNodeId: targetModel.nodeId,
          relationType: rel.relationType || "1-m",
        };
      })
      .filter((rel: any) => rel !== null); // Remove null entries

    // Deserialize back to React Flow format
    const { nodes, edges } = deserializeSchema({
      models: schema.models || [],
      relations: transformedRelations || [],
    });

    console.log("[load-schema] Deserialized schema:", {
      schemaId: schema.id,
      nodesCount: nodes.length,
      edgesCount: edges.length,
      nodeIds: nodes.map(n => n.id),
      edgeIds: edges.map(e => e.id),
    });

    return NextResponse.json(
      {
        schema: {
          id: schema.id,
          name: schema.name,
          description: schema.description,
          createdAt: schema.createdAt,
          updatedAt: schema.updatedAt,
          nodes,
          edges,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[load-schema] Load schema error:", {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { 
        error: null,
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
