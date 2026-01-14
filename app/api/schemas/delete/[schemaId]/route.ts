import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import prismadb from "@/app/libs/prismadb";

export async function DELETE(
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

    const user = await prismadb.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }

    // Verify ownership before deleting
    const schema = await (prismadb as any).databaseSchema.findFirst({
      where: {
        id: schemaId,
        userId: user.id,
      },
    });

    if (!schema) {
      return new Response(JSON.stringify({ error: "Schema not found" }), {
        status: 404,
      });
    }

    // Delete schema (cascades to models and relations)
    await (prismadb as any).databaseSchema.delete({
      where: { id: schemaId },
    });

    return new Response(
      JSON.stringify({ message: "Schema deleted successfully" }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete schema error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to delete schema" }),
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const { name, description } = await request.json();

    const user = await prismadb.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }

    // Verify ownership before updating
    const schema = await (prismadb as any).databaseSchema.findFirst({
      where: {
        id: schemaId,
        userId: user.id,
      },
    });

    if (!schema) {
      return new Response(JSON.stringify({ error: "Schema not found" }), {
        status: 404,
      });
    }

    // Update schema metadata
    const updatedSchema = await (prismadb as any).databaseSchema.update({
      where: { id: schemaId },
      data: {
        name: name || schema.name,
        description: description !== undefined ? description : schema.description,
        lastModifiedBy: user.email,
      },
    });

    return new Response(JSON.stringify({ schema: updatedSchema }), {
      status: 200,
    });
  } catch (error) {
    console.error("Update schema error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to update schema" }),
      { status: 500 }
    );
  }
}
