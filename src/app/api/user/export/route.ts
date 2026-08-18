import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/prisma";

export async function GET() {
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

    const projects = await db.project.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    });

    const fullProjectsData = await Promise.all(
      projects.map(async (project) => {
        const canvas = await db.canvas.getProjectCanvas(project.id, project.title);
        const share = await db.projectShare.findFirst({ where: { projectId: project.id } });
        return {
          id: project.id,
          title: project.title,
          description: project.description,
          folder: project.folder,
          tags: project.tags,
          isArchived: project.isArchived,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
          share: share
            ? { accessLevel: share.accessLevel, token: share.token, createdAt: share.createdAt }
            : null,
          nodes: canvas.nodes,
          edges: canvas.edges,
        };
      })
    );

    const exportPayload = {
      version: "1.0",
      app: "Antigravity MindMap",
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
      stats: {
        totalProjects: projects.length,
        totalNodes: fullProjectsData.reduce((acc, p) => acc + p.nodes.length, 0),
      },
      projects: fullProjectsData,
    };

    return new NextResponse(JSON.stringify(exportPayload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="antigravity_mindmaps_backup_${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (error: any) {
    console.error("GET /api/user/export error:", error);
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
  }
}
