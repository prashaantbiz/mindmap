import {
  PrismaClient,
  type User,
  type Project,
  type MindMapNode,
  type MindMapEdge,
  type ProjectShare,
  type VerificationToken,
  type Prisma,
} from "@prisma/client";
import fs from "fs";
import path from "path";

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

function getPrismaClient(): PrismaClient | null {
  try {
    if (global.prismaGlobal) return global.prismaGlobal;
    const client = new PrismaClient();
    if (process.env.NODE_ENV !== "production") {
      global.prismaGlobal = client;
    }
    return client;
  } catch {
    return null;
  }
}

export const prisma = getPrismaClient();

// Resilient DB layer providing both PostgreSQL Prisma execution and local dev fallback
export interface StoredUser {
  id: string;
  name: string | null;
  email: string | null;
  emailVerified: Date | null;
  image: string | null;
  passwordHash: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoredProject {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  nodeCount: number;
  folder: string | null;
  tags: string[];
  isArchived: boolean;
  isDefault: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoredMindMapNode {
  id: string;
  projectId: string;
  parentId: string | null;
  text: string;
  description: string | null;
  icon: string | null;
  color: string;
  positionX: number;
  positionY: number;
  collapsed: boolean;
  isRoot: boolean;
  imageUrl?: string | null;
  videoUrl?: string | null;
  linkUrl?: string | null;
  linkLabel?: string | null;
  attachments?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoredMindMapEdge {
  id: string;
  projectId: string;
  source: string;
  target: string;
  color: string | null;
  animated: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoredProjectShare {
  id: string;
  projectId: string;
  accessLevel: string;
  token: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoredVerificationToken {
  identifier: string;
  token: string;
  expires: Date;
  type: string;
}

interface DevDataStore {
  users: StoredUser[];
  projects: StoredProject[];
  mindMapNodes: StoredMindMapNode[];
  mindMapEdges: StoredMindMapEdge[];
  projectShares: StoredProjectShare[];
  verificationTokens: StoredVerificationToken[];
}

const dataFilePath = path.join(process.cwd(), ".dev-db-store.json");

function readDevStore(): DevDataStore {
  try {
    if (fs.existsSync(dataFilePath)) {
      const data = fs.readFileSync(dataFilePath, "utf-8");
      const parsed: DevDataStore = JSON.parse(data);
      parsed.projects = (parsed.projects || []).map((p: StoredProject) => ({
        id: p.id,
        title: p.title || "Untitled Mind Map",
        description: p.description || null,
        thumbnailUrl: p.thumbnailUrl || null,
        nodeCount: p.nodeCount || 1,
        folder: p.folder || "Personal",
        tags: p.tags || ["Ideas"],
        isArchived: p.isArchived ?? false,
        isDefault: p.isDefault ?? false,
        userId: p.userId,
        createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
        updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date(),
      }));
      parsed.mindMapNodes = parsed.mindMapNodes || [];
      parsed.mindMapEdges = parsed.mindMapEdges || [];
      parsed.projectShares = parsed.projectShares || [];
      return parsed;
    }
  } catch (err: unknown) {
    console.warn("Could not read local dev store:", err);
  }
  return { users: [], projects: [], mindMapNodes: [], mindMapEdges: [], projectShares: [], verificationTokens: [] };
}

function writeDevStore(data: DevDataStore) {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err: unknown) {
    console.warn("Could not save local dev store:", err);
  }
}

export const db = {
  user: {
    async findUnique({ where }: { where: { email?: string; id?: string } }): Promise<(StoredUser & { projects?: StoredProject[] }) | null> {
      try {
        if (prisma) {
          const user = await prisma.user.findUnique({ where: where as Prisma.UserWhereUniqueInput, include: { projects: true } });
          if (user) return user as unknown as StoredUser & { projects: StoredProject[] };
        }
      } catch {}
      const store = readDevStore();
      const found = store.users.find(
        (u: StoredUser) =>
          (where.email && u.email?.toLowerCase() === where.email.toLowerCase()) ||
          (where.id && u.id === where.id)
      );
      if (!found) return null;
      const projects = store.projects.filter((p: StoredProject) => p.userId === found.id);
      return { ...found, projects };
    },

    async create({ data }: { data: { name?: string | null; email?: string | null; emailVerified?: Date | null; image?: string | null; passwordHash?: string | null } }): Promise<StoredUser> {
      try {
        if (prisma) {
          const created = await prisma.user.create({ data: data as Prisma.UserCreateInput });
          return created as unknown as StoredUser;
        }
      } catch {}
      const store = readDevStore();
      const newUser: StoredUser = {
        id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: data.name || null,
        email: data.email || null,
        emailVerified: data.emailVerified || null,
        image: data.image || null,
        passwordHash: data.passwordHash || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      store.users.push(newUser);
      writeDevStore(store);
      return newUser;
    },

    async update({ where, data }: { where: { id?: string; email?: string }; data: Partial<StoredUser> }): Promise<StoredUser> {
      try {
        if (prisma) {
          const updated = await prisma.user.update({ where: where as Prisma.UserWhereUniqueInput, data: data as Prisma.UserUpdateInput });
          return updated as unknown as StoredUser;
        }
      } catch {}
      const store = readDevStore();
      const index = store.users.findIndex(
        (u: StoredUser) => (where.id && u.id === where.id) || (where.email && u.email === where.email)
      );
      if (index === -1) throw new Error("User not found in local store");
      store.users[index] = { ...store.users[index], ...data, updatedAt: new Date() };
      writeDevStore(store);
      return store.users[index];
    },

    async delete({ where }: { where: { id?: string; email?: string } }): Promise<StoredUser | null> {
      try {
        if (prisma) {
          const deleted = await prisma.user.delete({ where: where as Prisma.UserWhereUniqueInput });
          return deleted as unknown as StoredUser;
        }
      } catch {}
      const store = readDevStore();
      const user = store.users.find(
        (u: StoredUser) => (where.id && u.id === where.id) || (where.email && u.email === where.email)
      );
      if (user) {
        store.users = store.users.filter((u: StoredUser) => u.id !== user.id);
        const userProjects = store.projects.filter((p: StoredProject) => p.userId === user.id);
        const userProjectIds = new Set(userProjects.map((p: StoredProject) => p.id));
        store.projects = store.projects.filter((p: StoredProject) => p.userId !== user.id);
        store.mindMapNodes = store.mindMapNodes.filter((n: StoredMindMapNode) => !userProjectIds.has(n.projectId));
        store.mindMapEdges = store.mindMapEdges.filter((e: StoredMindMapEdge) => !userProjectIds.has(e.projectId));
        store.projectShares = store.projectShares.filter((s: StoredProjectShare) => !userProjectIds.has(s.projectId));
        writeDevStore(store);
      }
      return user || null;
    },
  },

  project: {
    async findMany({
      where,
      orderBy,
    }: {
      where: {
        userId: string;
        isArchived?: boolean;
        folder?: string;
        title?: { contains?: string; mode?: string };
      };
      orderBy?: { [key: string]: "asc" | "desc" };
    }): Promise<StoredProject[]> {
      try {
        if (prisma) {
          const projects = await prisma.project.findMany({ where: where as Prisma.ProjectWhereInput, orderBy: orderBy as Prisma.ProjectOrderByWithRelationInput });
          return projects as unknown as StoredProject[];
        }
      } catch {}
      const store = readDevStore();
      let projects = store.projects.filter((p: StoredProject) => p.userId === where.userId);

      if (where.isArchived !== undefined) {
        projects = projects.filter((p: StoredProject) => p.isArchived === where.isArchived);
      }
      if (where.folder) {
        projects = projects.filter((p: StoredProject) => p.folder === where.folder);
      }
      if (where.title?.contains) {
        const query = where.title.contains.toLowerCase();
        projects = projects.filter((p: StoredProject) => p.title.toLowerCase().includes(query));
      }

      if (orderBy) {
        const [field, dir] = Object.entries(orderBy)[0] as [keyof StoredProject, "asc" | "desc"];
        projects.sort((a, b) => {
          const aVal = a[field] ?? "";
          const bVal = b[field] ?? "";
          if (aVal < bVal) return dir === "asc" ? -1 : 1;
          if (aVal > bVal) return dir === "asc" ? 1 : -1;
          return 0;
        });
      }

      return projects;
    },

    async findUnique({ where }: { where: { id: string } }): Promise<StoredProject | null> {
      try {
        if (prisma) {
          const project = await prisma.project.findUnique({ where: where as Prisma.ProjectWhereUniqueInput });
          return project as unknown as StoredProject;
        }
      } catch {}
      const store = readDevStore();
      return store.projects.find((p: StoredProject) => p.id === where.id) || null;
    },

    async create({ data }: { data: { title: string; description?: string | null; thumbnailUrl?: string | null; nodeCount?: number; folder?: string | null; tags?: string[]; isArchived?: boolean; isDefault?: boolean; userId: string } }): Promise<StoredProject> {
      try {
        if (prisma) {
          const created = await prisma.project.create({ data: data as Prisma.ProjectUncheckedCreateInput });
          return created as unknown as StoredProject;
        }
      } catch {}
      const store = readDevStore();
      const newProj: StoredProject = {
        id: `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: data.title,
        description: data.description || null,
        thumbnailUrl: data.thumbnailUrl || null,
        nodeCount: data.nodeCount || 1,
        folder: data.folder || "Personal",
        tags: data.tags || [],
        isArchived: Boolean(data.isArchived),
        isDefault: Boolean(data.isDefault),
        userId: data.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      store.projects.push(newProj);
      writeDevStore(store);
      return newProj;
    },

    async update({ where, data }: { where: { id: string }; data: Partial<StoredProject> }): Promise<StoredProject> {
      try {
        if (prisma) {
          const updated = await prisma.project.update({ where: where as Prisma.ProjectWhereUniqueInput, data: { ...data, updatedAt: new Date() } as Prisma.ProjectUpdateInput });
          return updated as unknown as StoredProject;
        }
      } catch {}
      const store = readDevStore();
      const index = store.projects.findIndex((p: StoredProject) => p.id === where.id);
      if (index === -1) throw new Error("Project not found");
      store.projects[index] = {
        ...store.projects[index],
        ...data,
        updatedAt: new Date(),
      };
      writeDevStore(store);
      return store.projects[index];
    },

    async delete({ where }: { where: { id: string } }): Promise<StoredProject | null> {
      try {
        if (prisma) {
          const deleted = await prisma.project.delete({ where: where as Prisma.ProjectWhereUniqueInput });
          return deleted as unknown as StoredProject;
        }
      } catch {}
      const store = readDevStore();
      const found = store.projects.find((p: StoredProject) => p.id === where.id);
      store.projects = store.projects.filter((p: StoredProject) => p.id !== where.id);
      store.mindMapNodes = store.mindMapNodes.filter((n: StoredMindMapNode) => n.projectId !== where.id);
      store.mindMapEdges = store.mindMapEdges.filter((e: StoredMindMapEdge) => e.projectId !== where.id);
      writeDevStore(store);
      return found || null;
    },
  },

  canvas: {
    async getProjectCanvas(projectId: string, projectTitle: string = "Central Idea", template: string = "blank"): Promise<{ nodes: StoredMindMapNode[]; edges: StoredMindMapEdge[] }> {
      const getTemplateTree = (rootId: string, title: string) => {
        if (template === "roadmap") {
          return [
            { text: "Q1 Foundations", desc: "Auth & Canvas Editor", color: "#6366f1", x: 280, y: -90, icon: "🏗️", subs: ["Auth & Database", "Interactive Canvas"] },
            { text: "Q2 Collaboration", desc: "Real-time multi-user", color: "#06b6d4", x: 280, y: 90, icon: "👥", subs: ["Live Cursors", "Shared Workspaces"] },
            { text: "Q3 AI Intelligence", desc: "AI Node Generator", color: "#8b5cf6", x: -280, y: -90, icon: "✨", subs: ["Idea Generator", "Auto-Summarize"] },
            { text: "Q4 Enterprise", desc: "Security & Governance", color: "#10b981", x: -280, y: 90, icon: "🏢", subs: ["SSO Integration", "Audit Logs"] },
          ];
        }
        if (template === "architecture") {
          return [
            { text: "Frontend Client", desc: "Next.js App Router", color: "#6366f1", x: 280, y: -90, icon: "💻", subs: ["Tailwind Theme", "React Flow Canvas"] },
            { text: "API Gateway", desc: "REST & Middleware", color: "#06b6d4", x: 280, y: 90, icon: "🌐", subs: ["Route Protection", "Rate Limiter"] },
            { text: "Core Services", desc: "Business logic engine", color: "#ec4899", x: -280, y: -90, icon: "⚙️", subs: ["Layout Engine", "Sync Processor"] },
            { text: "Persistence Layer", desc: "Database & Storage", color: "#10b981", x: -280, y: 90, icon: "🗄️", subs: ["Postgres Database", "Prisma Client"] },
          ];
        }
        if (template === "meeting") {
          return [
            { text: "Agenda", desc: "Topics to cover", color: "#6366f1", x: 280, y: -90, icon: "📋", subs: ["Progress Review", "Q3 Priorities"] },
            { text: "Discussion", desc: "Key talking points", color: "#06b6d4", x: 280, y: 90, icon: "💬", subs: ["Performance", "User Feedback"] },
            { text: "Decisions", desc: "Agreed conclusions", color: "#10b981", x: -280, y: -90, icon: "✅", subs: ["Ship React Flow", "Adopt Tailwind"] },
            { text: "Action Items", desc: "Next immediate steps", color: "#f59e0b", x: -280, y: 90, icon: "⚡", subs: ["Test Autosave", "Verify Build"] },
          ];
        }
        if (template === "brainstorm") {
          return [
            { text: "Strengths & Assets", desc: "Core advantages", color: "#6366f1", x: 280, y: -90, icon: "💪", subs: ["Proprietary IP", "Agile Team"] },
            { text: "Opportunities", desc: "Growth potential", color: "#ec4899", x: 280, y: 90, icon: "🚀", subs: ["New Markets", "Add-on Features"] },
            { text: "Key Challenges", desc: "Risks to mitigate", color: "#f43f5e", x: -280, y: -90, icon: "⚠️", subs: ["Bandwidth", "Market Competition"] },
            { text: "Strategic Goals", desc: "Measurable targets", color: "#10b981", x: -280, y: 90, icon: "🎯", subs: ["Q3 Milestone", "User Retention"] },
          ];
        }
        return [
          { text: "Core Objectives", desc: "Primary goals and milestones", color: "#6366f1", x: 280, y: -90, icon: "🎯", subs: [] },
          { text: "Key Insights", desc: "Discoveries and data points", color: "#ec4899", x: 280, y: 90, icon: "🔍", subs: [] },
          { text: "Action Items", desc: "Tasks and execution steps", color: "#10b981", x: -280, y: -90, icon: "⚡", subs: [] },
          { text: "Resources & Notes", desc: "References and links", color: "#f59e0b", x: -280, y: 90, icon: "📚", subs: [] },
        ];
      };

      try {
        if (prisma) {
          let nodes = await prisma.mindMapNode.findMany({ where: { projectId } });
          let edges = await prisma.mindMapEdge.findMany({ where: { projectId } });

          if (nodes.length === 0) {
            const root = await prisma.mindMapNode.create({
              data: {
                projectId,
                parentId: null,
                text: projectTitle || "Central Idea",
                description: "Root concept of your mind map",
                icon: "💡",
                color: "#6366f1",
                positionX: 0,
                positionY: 0,
                collapsed: false,
                isRoot: true,
              },
            });

            const branchTemplates = getTemplateTree(root.id, projectTitle);

            for (const b of branchTemplates) {
              const child = await prisma.mindMapNode.create({
                data: {
                  projectId,
                  parentId: root.id,
                  text: b.text,
                  description: b.desc,
                  icon: b.icon,
                  color: b.color,
                  positionX: b.x,
                  positionY: b.y,
                  collapsed: false,
                  isRoot: false,
                },
              });

              await prisma.mindMapEdge.create({
                data: {
                  projectId,
                  source: root.id,
                  target: child.id,
                  color: b.color,
                  animated: true,
                },
              });

              for (let j = 0; j < (b.subs || []).length; j++) {
                const subText = b.subs[j];
                const subX = b.x > 0 ? b.x + 240 : b.x - 240;
                const subY = b.y + (j === 0 ? -40 : 40);

                const subChild = await prisma.mindMapNode.create({
                  data: {
                    projectId,
                    parentId: child.id,
                    text: subText,
                    description: null,
                    icon: null,
                    color: b.color,
                    positionX: subX,
                    positionY: subY,
                    collapsed: false,
                    isRoot: false,
                  },
                });

                await prisma.mindMapEdge.create({
                  data: {
                    projectId,
                    source: child.id,
                    target: subChild.id,
                    color: b.color,
                    animated: true,
                  },
                });
              }
            }

            nodes = await prisma.mindMapNode.findMany({ where: { projectId } });
            edges = await prisma.mindMapEdge.findMany({ where: { projectId } });
          }

          return { nodes: nodes as unknown as StoredMindMapNode[], edges: edges as unknown as StoredMindMapEdge[] };
        }
      } catch {}

      const store = readDevStore();
      let nodes = store.mindMapNodes.filter((n: StoredMindMapNode) => n.projectId === projectId);
      let edges = store.mindMapEdges.filter((e: StoredMindMapEdge) => e.projectId === projectId);

      if (nodes.length === 0) {
        const rootId = `node_${Date.now()}_root`;
        const rootNode: StoredMindMapNode = {
          id: rootId,
          projectId,
          parentId: null,
          text: projectTitle || "Central Idea",
          description: "Root concept of your mind map",
          icon: "💡",
          color: "#6366f1",
          positionX: 0,
          positionY: 0,
          collapsed: false,
          isRoot: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        store.mindMapNodes.push(rootNode);

        const branchTemplates = getTemplateTree(rootId, projectTitle);

        branchTemplates.forEach((b: { text: string; desc: string; color: string; x: number; y: number; icon: string; subs?: string[] }, i: number) => {
          const childId = `node_${Date.now()}_${i}`;
          store.mindMapNodes.push({
            id: childId,
            projectId,
            parentId: rootId,
            text: b.text,
            description: b.desc,
            icon: b.icon,
            color: b.color,
            positionX: b.x,
            positionY: b.y,
            collapsed: false,
            isRoot: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          store.mindMapEdges.push({
            id: `edge_${rootId}_${childId}`,
            projectId,
            source: rootId,
            target: childId,
            color: b.color,
            animated: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          (b.subs || []).forEach((subText: string, j: number) => {
            const subId = `node_${Date.now()}_${i}_${j}`;
            const subX = b.x > 0 ? b.x + 240 : b.x - 240;
            const subY = b.y + (j === 0 ? -40 : 40);

            store.mindMapNodes.push({
              id: subId,
              projectId,
              parentId: childId,
              text: subText,
              description: null,
              icon: null,
              color: b.color,
              positionX: subX,
              positionY: subY,
              collapsed: false,
              isRoot: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            });

            store.mindMapEdges.push({
              id: `edge_${childId}_${subId}`,
              projectId,
              source: childId,
              target: subId,
              color: b.color,
              animated: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          });
        });

        writeDevStore(store);
        nodes = store.mindMapNodes.filter((n: StoredMindMapNode) => n.projectId === projectId);
        edges = store.mindMapEdges.filter((e: StoredMindMapEdge) => e.projectId === projectId);
      }

      return { nodes, edges };
    },

    async saveProjectCanvas(
      projectId: string,
      nodes: Array<{
        id: string;
        parentId?: string | null;
        text: string;
        description?: string | null;
        icon?: string | null;
        color?: string;
        positionX?: number;
        positionY?: number;
        position?: { x: number; y: number };
        collapsed?: boolean;
        isRoot?: boolean;
        imageUrl?: string | null;
        videoUrl?: string | null;
        linkUrl?: string | null;
        linkLabel?: string | null;
        attachments?: string | null;
      }>,
      edges: Array<{
        id: string;
        source: string;
        target: string;
        color?: string | null;
        animated?: boolean;
      }>
    ): Promise<{ success: boolean; count: number }> {
      try {
        if (prisma) {
          await prisma.mindMapEdge.deleteMany({ where: { projectId } });
          await prisma.mindMapNode.deleteMany({ where: { projectId } });

          for (const n of nodes) {
            await prisma.mindMapNode.create({
              data: {
                id: n.id,
                projectId,
                parentId: n.parentId || null,
                text: n.text || "Untitled",
                description: n.description || null,
                icon: n.icon || null,
                color: n.color || "#6366f1",
                positionX: n.positionX ?? n.position?.x ?? 0,
                positionY: n.positionY ?? n.position?.y ?? 0,
                collapsed: Boolean(n.collapsed),
                isRoot: Boolean(n.isRoot),
                imageUrl: n.imageUrl || null,
                videoUrl: n.videoUrl || null,
                linkUrl: n.linkUrl || null,
                linkLabel: n.linkLabel || null,
                attachments: n.attachments ? (typeof n.attachments === "string" ? n.attachments : JSON.stringify(n.attachments)) : null,
              },
            });
          }

          for (const e of edges) {
            await prisma.mindMapEdge.create({
              data: {
                id: e.id,
                projectId,
                source: e.source,
                target: e.target,
                color: e.color || "#6366f1",
                animated: Boolean(e.animated),
              },
            });
          }

          await prisma.project.update({
            where: { id: projectId },
            data: {
              nodeCount: nodes.length,
              updatedAt: new Date(),
            },
          });

          return { success: true, count: nodes.length };
        }
      } catch {}

      const store = readDevStore();
      store.mindMapNodes = store.mindMapNodes.filter((n: StoredMindMapNode) => n.projectId !== projectId);
      store.mindMapEdges = store.mindMapEdges.filter((e: StoredMindMapEdge) => e.projectId !== projectId);

      nodes.forEach((n) => {
        store.mindMapNodes.push({
          id: n.id,
          projectId,
          parentId: n.parentId || null,
          text: n.text || "Untitled",
          description: n.description || null,
          icon: n.icon || null,
          color: n.color || "#6366f1",
          positionX: n.positionX ?? n.position?.x ?? 0,
          positionY: n.positionY ?? n.position?.y ?? 0,
          collapsed: Boolean(n.collapsed),
          isRoot: Boolean(n.isRoot),
          imageUrl: n.imageUrl || null,
          videoUrl: n.videoUrl || null,
          linkUrl: n.linkUrl || null,
          linkLabel: n.linkLabel || null,
          attachments: n.attachments ? (typeof n.attachments === "string" ? n.attachments : JSON.stringify(n.attachments)) : null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });

      edges.forEach((e) => {
        store.mindMapEdges.push({
          id: e.id,
          projectId,
          source: e.source,
          target: e.target,
          color: e.color || "#6366f1",
          animated: Boolean(e.animated),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });

      const projIndex = store.projects.findIndex((p: StoredProject) => p.id === projectId);
      if (projIndex !== -1) {
        store.projects[projIndex].nodeCount = nodes.length;
        store.projects[projIndex].updatedAt = new Date();
      }

      writeDevStore(store);
      return { success: true, count: nodes.length };
    },
  },

  verificationToken: {
    async create({
      data,
    }: {
      data: { identifier: string; token: string; expires: Date; type?: string };
    }): Promise<StoredVerificationToken> {
      try {
        if (prisma) {
          const created = await prisma.verificationToken.create({ data: data as Prisma.VerificationTokenCreateInput });
          return created as unknown as StoredVerificationToken;
        }
      } catch {}
      const store = readDevStore();
      store.verificationTokens = store.verificationTokens.filter(
        (t: StoredVerificationToken) =>
          !(
            t.identifier === data.identifier &&
            t.type === (data.type || "EMAIL_VERIFICATION")
          )
      );
      const tokenEntry: StoredVerificationToken = {
        identifier: data.identifier,
        token: data.token,
        expires: data.expires,
        type: data.type || "EMAIL_VERIFICATION",
      };
      store.verificationTokens.push(tokenEntry);
      writeDevStore(store);
      return tokenEntry;
    },

    async findUnique({ where }: { where: { token: string } }): Promise<StoredVerificationToken | null> {
      try {
        if (prisma) {
          const found = await prisma.verificationToken.findUnique({ where: where as Prisma.VerificationTokenWhereUniqueInput });
          return found as unknown as StoredVerificationToken;
        }
      } catch {}
      const store = readDevStore();
      return store.verificationTokens.find((t: StoredVerificationToken) => t.token === where.token) || null;
    },

    async delete({ where }: { where: { token: string } }): Promise<StoredVerificationToken | null> {
      try {
        if (prisma) {
          const deleted = await prisma.verificationToken.delete({ where: where as Prisma.VerificationTokenWhereUniqueInput });
          return deleted as unknown as StoredVerificationToken;
        }
      } catch {}
      const store = readDevStore();
      const found = store.verificationTokens.find((t: StoredVerificationToken) => t.token === where.token);
      store.verificationTokens = store.verificationTokens.filter(
        (t: StoredVerificationToken) => t.token !== where.token
      );
      writeDevStore(store);
      return found || null;
    },
  },

  projectShare: {
    async findFirst({ where }: { where: { projectId?: string; token?: string } }): Promise<StoredProjectShare | null> {
      try {
        if (prisma) {
          const found = await prisma.projectShare.findFirst({ where: where as Prisma.ProjectShareWhereInput });
          return found as unknown as StoredProjectShare;
        }
      } catch {}
      const store = readDevStore();
      return (
        store.projectShares.find(
          (s: StoredProjectShare) =>
            (where.projectId && s.projectId === where.projectId) ||
            (where.token && s.token === where.token)
        ) || null
      );
    },

    async upsert({
      projectId,
      accessLevel,
      token,
    }: {
      projectId: string;
      accessLevel: string;
      token?: string;
    }): Promise<StoredProjectShare> {
      const shareToken =
        token ||
        `sh_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      try {
        if (prisma) {
          const existing = await prisma.projectShare.findFirst({
            where: { projectId },
          });
          if (existing) {
            const updated = await prisma.projectShare.update({
              where: { id: existing.id },
              data: { accessLevel, updatedAt: new Date() },
            });
            return updated as unknown as StoredProjectShare;
          } else {
            const created = await prisma.projectShare.create({
              data: {
                projectId,
                accessLevel,
                token: shareToken,
              },
            });
            return created as unknown as StoredProjectShare;
          }
        }
      } catch {}

      const store = readDevStore();
      const index = store.projectShares.findIndex((s: StoredProjectShare) => s.projectId === projectId);
      if (index !== -1) {
        store.projectShares[index].accessLevel = accessLevel;
        store.projectShares[index].updatedAt = new Date();
        writeDevStore(store);
        return store.projectShares[index];
      } else {
        const newShare: StoredProjectShare = {
          id: `share_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          projectId,
          accessLevel,
          token: shareToken,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        store.projectShares.push(newShare);
        writeDevStore(store);
        return newShare;
      }
    },

    async delete({ where }: { where: { projectId?: string; token?: string } }): Promise<StoredProjectShare | null> {
      try {
        if (prisma) {
          const existing = await prisma.projectShare.findFirst({ where: where as Prisma.ProjectShareWhereInput });
          if (existing) {
            const deleted = await prisma.projectShare.delete({ where: { id: existing.id } });
            return deleted as unknown as StoredProjectShare;
          }
        }
      } catch {}

      const store = readDevStore();
      const found = store.projectShares.find(
        (s: StoredProjectShare) =>
          (where.projectId && s.projectId === where.projectId) ||
          (where.token && s.token === where.token)
      );
      store.projectShares = store.projectShares.filter(
        (s: StoredProjectShare) =>
          !(
            (where.projectId && s.projectId === where.projectId) ||
            (where.token && s.token === where.token)
          )
      );
      writeDevStore(store);
      return found || null;
    },
  },
};
