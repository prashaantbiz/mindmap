import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions, getOrCreateAuthenticatedUser } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { z } from "zod";

const updateProjectSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  folder: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isArchived: z.boolean().optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const project = await db.project.findUnique({ where: { id } });

    if (!project) {
      return NextResponse.json({ error: "Mind map not found" }, { status: 404 });
    }

    return NextResponse.json({ project });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch project";
    console.error("GET /api/projects/[id] error:", message);
    return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 });
  }
}

export async function PATCH(
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
    const existing = await db.project.findUnique({ where: { id } });

    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: "Mind map not found or unauthorized" }, { status: 404 });
    }

    const body = await req.json();
    const result = updateProjectSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Invalid update payload" }, { status: 400 });
    }

    const updated = await db.project.update({
      where: { id },
      data: result.data,
    });

    return NextResponse.json({ message: "Mind map updated successfully", project: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update mind map";
    console.error("PATCH /api/projects/[id] error:", message);
    return NextResponse.json({ error: "Failed to update mind map" }, { status: 500 });
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

    const user = await getOrCreateAuthenticatedUser(session.user);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { id } = await params;
    const existing = await db.project.findUnique({ where: { id } });

    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: "Mind map not found or unauthorized" }, { status: 404 });
    }

    await db.project.delete({ where: { id } });

    return NextResponse.json({ message: "Mind map deleted successfully" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete mind map";
    console.error("DELETE /api/projects/[id] error:", message);
    return NextResponse.json({ error: "Failed to delete mind map" }, { status: 500 });
  }
}
