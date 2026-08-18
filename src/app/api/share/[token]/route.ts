import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!token) {
      return NextResponse.json({ error: "Share token required" }, { status: 400 });
    }

    const share = await db.projectShare.findFirst({
      where: { token },
    });

    if (!share) {
      return NextResponse.json({ error: "Invalid or expired share link" }, { status: 404 });
    }

    const project = await db.project.findUnique({
      where: { id: share.projectId },
    });

    if (!project) {
      return NextResponse.json({ error: "Shared mind map no longer exists" }, { status: 404 });
    }

    const canvas = await db.canvas.getProjectCanvas(project.id, project.title);

    return NextResponse.json({
      project: {
        id: project.id,
        title: project.title,
        description: project.description,
        folder: project.folder,
        tags: project.tags,
        updatedAt: project.updatedAt,
      },
      accessLevel: share.accessLevel,
      nodes: canvas.nodes,
      edges: canvas.edges,
    });
  } catch (error: any) {
    console.error("GET /api/share/[token] error:", error);
    return NextResponse.json({ error: "Failed to load shared mind map" }, { status: 500 });
  }
}
