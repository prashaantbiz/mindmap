import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions, getOrCreateAuthenticatedUser } from "@/lib/auth";
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

    const user = await getOrCreateAuthenticatedUser(session.user);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { id } = await params;
    const source = await db.project.findUnique({ where: { id } });

    if (!source || source.userId !== user.id) {
      return NextResponse.json({ error: "Source mind map not found" }, { status: 404 });
    }

    const sourceCanvas = await db.canvas.getProjectCanvas(source.id, source.title);

    const duplicated = await db.project.create({
      data: {
        title: `${source.title} (Copy)`,
        description: source.description,
        thumbnailUrl: source.thumbnailUrl,
        nodeCount: sourceCanvas.nodes.length || source.nodeCount,
        folder: source.folder,
        tags: [...source.tags],
        isArchived: false,
        isDefault: false,
        userId: user.id,
      },
    });

    if (sourceCanvas.nodes.length > 0) {
      // Map old node IDs to new node IDs
      const idMap = new Map<string, string>();
      const newNodes = sourceCanvas.nodes.map((n) => {
        const newId = `node_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        idMap.set(n.id, newId);
        return { ...n, id: newId };
      });

      const finalNodes = newNodes.map((n) => ({
        ...n,
        parentId: n.parentId ? idMap.get(n.parentId) || null : null,
      }));

      const finalEdges = sourceCanvas.edges
        .filter((e) => idMap.has(e.source) && idMap.has(e.target))
        .map((e) => ({
          ...e,
          id: `edge_${idMap.get(e.source)}_${idMap.get(e.target)}`,
          source: idMap.get(e.source)!,
          target: idMap.get(e.target)!,
        }));

      await db.canvas.saveProjectCanvas(duplicated.id, finalNodes, finalEdges);
    }

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
