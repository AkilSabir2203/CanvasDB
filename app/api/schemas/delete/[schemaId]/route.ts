import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import prismadb from "@/app/libs/prismadb";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ schemaId: string }> }
) {
  try {
    const { schemaId } = await context.params;

    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prismadb.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify ownership
    const schema = await (prismadb as any).databaseSchema.findFirst({
      where: {
        id: schemaId,
        userId: user.id,
      },
    });

    if (!schema) {
      return NextResponse.json({ error: "Schema not found" }, { status: 404 });
    }

    // Delete schema (cascade)
    await (prismadb as any).databaseSchema.delete({
      where: { id: schemaId },
    });

    return NextResponse.json(
      { message: "Schema deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete schema error:", error);
    return NextResponse.json(
      { error: "Failed to delete schema" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ schemaId: string }> }
) {
  try {
    const { schemaId } = await context.params;

    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description } = await request.json();

    const user = await prismadb.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify ownership
    const schema = await (prismadb as any).databaseSchema.findFirst({
      where: {
        id: schemaId,
        userId: user.id,
      },
    });

    if (!schema) {
      return NextResponse.json({ error: "Schema not found" }, { status: 404 });
    }

    // Update schema metadata
    const updatedSchema = await (prismadb as any).databaseSchema.update({
      where: { id: schemaId },
      data: {
        name: name ?? schema.name,
        description: description ?? schema.description,
        lastModifiedBy: user.email,
      },
    });

    return NextResponse.json({ schema: updatedSchema }, { status: 200 });
  } catch (error) {
    console.error("Update schema error:", error);
    return NextResponse.json(
      { error: "Failed to update schema" },
      { status: 500 }
    );
  }
}
