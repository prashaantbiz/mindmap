import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { id } = await params;
    const source = await db.project.findUnique({ where: { id } });

    if (!source || source.userId !== user.id) {
      return NextResponse.json({ error: "Source mind map not found" }, { status: 404 });
    }

    const duplicated = await db.project.create({
      data: {
        title: `${source.title} (Copy)`,
        description: source.description,
        thumbnailUrl: source.thumbnailUrl,
        nodeCount: source.nodeCount,
        folder: source.folder,
        tags: [...source.tags],
        isArchived: false,
        isDefault: false,
        userId: user.id,
      },
    });

    return NextResponse.json(
      { message: "Mind map duplicated successfully", project: duplicated },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to duplicate mind map";
    console.error("POST /api/projects/[id]/duplicate error:", message);
    return NextResponse.json({ error: "Failed to duplicate mind map" }, { status: 500 });
  }
}
