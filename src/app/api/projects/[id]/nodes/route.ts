import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions, getOrCreateAuthenticatedUser } from "@/lib/auth";
import { db } from "@/lib/prisma";

export async function GET(
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

    const { id: projectId } = await params;
    const project = await db.project.findUnique({ where: { id: projectId } });

    if (!project || project.userId !== user.id) {
      return NextResponse.json({ error: "Mind map not found or unauthorized" }, { status: 404 });
    }

    let templateKey = "blank";
    const lowerTags = (project.tags || []).map((t: string) => t.toLowerCase());
    if (lowerTags.includes("system-architecture") || lowerTags.includes("architecture")) templateKey = "system-architecture";
    else if (lowerTags.includes("ai-pipeline") || lowerTags.includes("ai")) templateKey = "ai-pipeline";
    else if (lowerTags.includes("engineering-roadmap") || lowerTags.includes("roadmap") || lowerTags.includes("sprint")) templateKey = "engineering-roadmap";
    else if (lowerTags.includes("product-growth") || lowerTags.includes("gtm") || lowerTags.includes("growth")) templateKey = "product-growth";
    else if (lowerTags.includes("consultation-process") || lowerTags.includes("consultation") || lowerTags.includes("strategy") || lowerTags.includes("meeting")) templateKey = "consultation-process";
    else if (lowerTags.includes("design-system") || lowerTags.includes("design") || lowerTags.includes("ux")) templateKey = "design-system";
    else if (lowerTags.includes("brainstorm")) templateKey = "product-growth";

    const canvas = await db.canvas.getProjectCanvas(projectId, project.title, templateKey);

    return NextResponse.json({
      project,
      nodes: canvas.nodes,
      edges: canvas.edges,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load canvas data";
    console.error("GET /api/projects/[id]/nodes error:", message);
    return NextResponse.json({ error: "Failed to load canvas data" }, { status: 500 });
  }
}

export async function PUT(
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

    const { id: projectId } = await params;
    const project = await db.project.findUnique({ where: { id: projectId } });

    if (!project || project.userId !== user.id) {
      return NextResponse.json({ error: "Mind map not found or unauthorized" }, { status: 404 });
    }

    const body = await req.json();
    const { nodes, edges } = body;

    if (!Array.isArray(nodes) || !Array.isArray(edges)) {
      return NextResponse.json({ error: "Invalid canvas payload format" }, { status: 400 });
    }

    const result = await db.canvas.saveProjectCanvas(projectId, nodes, edges);

    return NextResponse.json({
      message: "Canvas saved successfully",
      savedAt: new Date().toISOString(),
      nodeCount: result.count,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to autosave canvas";
    console.error("PUT /api/projects/[id]/nodes error:", message);
    return NextResponse.json({ error: "Failed to autosave canvas" }, { status: 500 });
  }
}
