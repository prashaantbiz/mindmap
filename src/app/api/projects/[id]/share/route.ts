import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
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

    const user = await db.user.findUnique({
      where: { email: session.user.email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { id: projectId } = await params;
    const project = await db.project.findUnique({ where: { id: projectId } });

    if (!project || project.userId !== user.id) {
      return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
    }

    const share = await db.projectShare.findFirst({
      where: { projectId },
    });

    return NextResponse.json({
      isShared: Boolean(share),
      share: share || null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch share settings";
    console.error("GET /api/projects/[id]/share error:", message);
    return NextResponse.json({ error: "Failed to fetch share settings" }, { status: 500 });
  }
}

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

    const { id: projectId } = await params;
    const project = await db.project.findUnique({ where: { id: projectId } });

    if (!project || project.userId !== user.id) {
      return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
    }

    const body = await req.json();
    const { accessLevel = "view", enabled = true } = body;

    if (!enabled) {
      await db.projectShare.delete({ where: { projectId } });
      return NextResponse.json({
        message: "Public link disabled",
        isShared: false,
        share: null,
      });
    }

    const share = await db.projectShare.upsert({
      projectId,
      accessLevel,
    });

    return NextResponse.json({
      message: "Share settings updated",
      isShared: true,
      share,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update share settings";
    console.error("POST /api/projects/[id]/share error:", message);
    return NextResponse.json({ error: "Failed to update share settings" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;
    await db.projectShare.delete({ where: { projectId } });

    return NextResponse.json({ message: "Share link revoked successfully" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to revoke share link";
    console.error("DELETE /api/projects/[id]/share error:", message);
    return NextResponse.json({ error: "Failed to revoke share link" }, { status: 500 });
  }
}
