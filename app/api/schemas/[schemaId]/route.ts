import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import prismadb from "@/app/libs/prismadb";
import { deserializeSchema } from "@/app/libs/schemaSerializer";

export async function GET(
  request: Request,
  { params }: { params: { schemaId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const { schemaId } = params;

    // Get user
    const user = await prismadb.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
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
      return new Response(JSON.stringify({ error: "Schema not found" }), {
        status: 404,
      });
    }

    // Transform relations to use nodeId instead of modelId
    const transformedData = {
      ...schema,
      relations: schema.relations.map((rel: any) => {
        const sourceModel = schema.models.find((m: any) => m.id === rel.sourceModelId);
        const targetModel = schema.models.find((m: any) => m.id === rel.targetModelId);

        return {
          ...rel,
          sourceNodeId: sourceModel?.nodeId,
          targetNodeId: targetModel?.nodeId,
        };
      }),
    };

    // Deserialize back to React Flow format
    const { nodes, edges } = deserializeSchema({
      models: transformedData.models,
      relations: transformedData.relations,
    });

    return new Response(
      JSON.stringify({
        schema: {
          id: schema.id,
          name: schema.name,
          description: schema.description,
          createdAt: schema.createdAt,
          updatedAt: schema.updatedAt,
          nodes,
          edges,
        },
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Load schema error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to load schema" }),
      { status: 500 }
    );
  }
}
