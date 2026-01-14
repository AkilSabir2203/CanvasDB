import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import prismadb from "@/app/libs/prismadb";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const user = await prismadb.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
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

    return new Response(JSON.stringify({ schemas }), { status: 200 });
  } catch (error) {
    console.error("List schemas error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to list schemas" }),
      { status: 500 }
    );
  }
}
