import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions, getOrCreateAuthenticatedUser } from "@/lib/auth";
import { db, StoredProject } from "@/lib/prisma";
import { z } from "zod";

const createProjectSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
  description: z.string().max(500).optional(),
  template: z.enum(["blank", "brainstorm", "roadmap", "architecture", "meeting"]).default("blank"),
  folder: z.string().default("Personal"),
  tags: z.array(z.string()).default([]),
});

const TEMPLATE_NODE_COUNTS: Record<string, { count: number; defaultTags: string[]; desc: string }> = {
  blank: { count: 1, defaultTags: ["Blank"], desc: "Blank canvas with a single root idea" },
  brainstorm: { count: 15, defaultTags: ["Brainstorm", "Strategy"], desc: "Strengths, Opportunities, Risks, & Action items" },
  roadmap: { count: 12, defaultTags: ["Roadmap", "Product"], desc: "Quarterly release milestones and feature branches" },
  architecture: { count: 8, defaultTags: ["Architecture", "System"], desc: "Client, API gateway, microservices, and databases" },
  meeting: { count: 10, defaultTags: ["Meeting", "Action Items"], desc: "Agenda, discussion points, key decisions, and next steps" },
};

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getOrCreateAuthenticatedUser(session.user);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const folder = searchParams.get("folder") || "";
    const isArchivedParam = searchParams.get("archived");
    const sort = searchParams.get("sort") || "recent";

    const isArchived = isArchivedParam === "true";

    let orderBy: { [key: string]: "asc" | "desc" } = { updatedAt: "desc" };
    if (sort === "alphabetical") {
      orderBy = { title: "asc" };
    } else if (sort === "created") {
      orderBy = { createdAt: "desc" };
    } else if (sort === "nodes") {
      orderBy = { nodeCount: "desc" };
    }

    const whereClause: {
      userId: string;
      isArchived: boolean;
      folder?: string;
      title?: { contains: string };
    } = {
      userId: user.id,
      isArchived,
    };

    if (folder && folder !== "All" && folder !== "Recent") {
      whereClause.folder = folder;
    }

    if (search.trim()) {
      whereClause.title = { contains: search.trim() };
    }

    const projects = await db.project.findMany({
      where: whereClause,
      orderBy,
    });

    // Extract all unique folders for this user
    const allUserProjects: StoredProject[] = await db.project.findMany({
      where: { userId: user.id, isArchived: false },
    });
    const folderSet = new Set<string>(["Personal", "Work"]);
    allUserProjects.forEach((p: StoredProject) => {
      if (p.folder) folderSet.add(p.folder);
    });

    return NextResponse.json({
      projects,
      folders: Array.from(folderSet),
      stats: {
        total: allUserProjects.length,
        totalNodes: allUserProjects.reduce((acc: number, p: StoredProject) => acc + (p.nodeCount || 1), 0),
        archivedCount: (await db.project.findMany({ where: { userId: user.id, isArchived: true } })).length,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch mind maps";
    console.error("GET /api/projects error:", message);
    return NextResponse.json({ error: "Failed to fetch mind maps" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getOrCreateAuthenticatedUser(session.user);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const result = createProjectSchema.safeParse(body);

    if (!result.success) {
      const errorMessage = result.error.issues?.[0]?.message || "Invalid input";
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    const { title, description, template, folder, tags } = result.data;
    const templateConfig = TEMPLATE_NODE_COUNTS[template] || TEMPLATE_NODE_COUNTS.blank;

    const mergedTags = Array.from(new Set([...tags, ...templateConfig.defaultTags]));

    const newProject = await db.project.create({
      data: {
        title: title.trim(),
        description: description || templateConfig.desc,
        nodeCount: templateConfig.count,
        folder: folder || "Personal",
        tags: mergedTags,
        isArchived: false,
        isDefault: false,
        userId: user.id,
      },
    });

    return NextResponse.json(
      { message: "Mind map created successfully", project: newProject },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create mind map";
    console.error("POST /api/projects error:", message);
    return NextResponse.json({ error: "Failed to create mind map" }, { status: 500 });
  }
}
