import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import prismadb from "@/app/libs/prismadb";

export async function GET(request: NextRequest) {
  try {
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

    // Fetch all schemas for the user
    const schemas = await (prismadb as any).databaseSchema.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        lastModifiedBy: true,
        _count: {
          select: {
            models: true,
            relations: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Map _count to modelCount and relationCount
    const mappedSchemas = schemas.map((schema: any) => ({
      id: schema.id,
      name: schema.name,
      description: schema.description,
      createdAt: schema.createdAt,
      updatedAt: schema.updatedAt,
      lastModifiedBy: schema.lastModifiedBy,
      modelCount: schema._count.models,
      relationCount: schema._count.relations,
    }));

    return NextResponse.json({ schemas: mappedSchemas }, { status: 200 });
  } catch (error) {
    console.error("List schemas error:", error);
    return NextResponse.json(
      { error: "Failed to list schemas" },
      { status: 500 }
    );
  }
}
