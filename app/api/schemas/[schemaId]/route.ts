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
    const transformedRelations = schema.relations.map((rel: any) => {
      const sourceModel = schema.models.find(
        (m: any) => m.id === rel.sourceModelId
      );
      const targetModel = schema.models.find(
        (m: any) => m.id === rel.targetModelId
      );

      return {
        ...rel,
        sourceNodeId: sourceModel?.nodeId,
        targetNodeId: targetModel?.nodeId,
      };
    });

    // Deserialize back to React Flow format
    const { nodes, edges } = deserializeSchema({
      models: schema.models,
      relations: transformedRelations,
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
  } catch (error) {
    console.error("Load schema error:", error);
    return NextResponse.json(
      { error: "Failed to load schema" },
      { status: 500 }
    );
  }
}
