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
import { getTemplateById } from "./templates";

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

function getPrismaClient(): PrismaClient | null {
  try {
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.trim() === "") {
      return null;
    }
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

declare global {
  // eslint-disable-next-line no-var
  var __inMemoryDevStore: DevDataStore | undefined;
  // eslint-disable-next-line no-var
  var __devStoreLastMtime: number | undefined;
}

interface DevDataStore {
  users: StoredUser[];
  projects: StoredProject[];
  mindMapNodes: StoredMindMapNode[];
  mindMapEdges: StoredMindMapEdge[];
  projectShares: StoredProjectShare[];
  verificationTokens: StoredVerificationToken[];
}

const getStorePath = () => {
  try {
    if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
      return path.join("/tmp", ".dev-db-store.json");
    }
    return path.join(process.cwd(), ".dev-db-store.json");
  } catch {
    return path.join(process.cwd(), ".dev-db-store.json");
  }
};

function sanitizeStore(store: Partial<DevDataStore>): DevDataStore {
  return {
    users: (store.users || []).filter((u) => Boolean(u && typeof u === "object" && u.id)),
    projects: (store.projects || [])
      .filter((p) => Boolean(p && typeof p === "object" && p.id && p.userId))
      .map((p: StoredProject) => ({
        id: p.id,
        title: p.title || "Untitled Mind Map",
        description: p.description || null,
        thumbnailUrl: p.thumbnailUrl || null,
        nodeCount: p.nodeCount || 1,
        folder: p.folder || "Personal",
        tags: Array.isArray(p.tags) ? p.tags : [],
        isArchived: Boolean(p.isArchived),
        isDefault: Boolean(p.isDefault),
        userId: p.userId,
        createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
        updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date(),
      })),
    mindMapNodes: (store.mindMapNodes || []).filter((n) => Boolean(n && typeof n === "object" && n.id && n.projectId)),
    mindMapEdges: (store.mindMapEdges || []).filter((e) => Boolean(e && typeof e === "object" && e.id && e.projectId)),
    projectShares: (store.projectShares || []).filter((s) => Boolean(s && typeof s === "object" && s.id && s.projectId)),
    verificationTokens: (store.verificationTokens || []).filter((t) => Boolean(t && typeof t === "object" && t.token)),
  };
}

function readDevStore(): DevDataStore {
  const storePath = getStorePath();
  try {
    if (fs.existsSync(storePath)) {
      const stat = fs.statSync(storePath);
      // Return memory cache ONLY if disk file has NOT been modified since our last read/write
      if (
        global.__inMemoryDevStore &&
        global.__devStoreLastMtime &&
        stat.mtimeMs <= global.__devStoreLastMtime
      ) {
        return sanitizeStore(global.__inMemoryDevStore);
      }

      // Re-read file from disk if uninitialized or modified on disk
      const data = fs.readFileSync(storePath, "utf-8");
      const parsed: DevDataStore = JSON.parse(data);
      const sanitized = sanitizeStore(parsed);

      global.__inMemoryDevStore = sanitized;
      global.__devStoreLastMtime = stat.mtimeMs;
      return sanitized;
    }
  } catch (err: unknown) {
    console.warn("Could not read local dev store:", err);
  }

  if (global.__inMemoryDevStore) {
    return sanitizeStore(global.__inMemoryDevStore);
  }

  const initialStore: DevDataStore = sanitizeStore({
    users: [],
    projects: [],
    mindMapNodes: [],
    mindMapEdges: [],
    projectShares: [],
    verificationTokens: [],
  });
  global.__inMemoryDevStore = initialStore;
  global.__devStoreLastMtime = Date.now();
  return initialStore;
}

function writeDevStore(data: DevDataStore) {
  const sanitized = sanitizeStore(data);
  global.__inMemoryDevStore = sanitized;
  const storePath = getStorePath();
  const jsonContent = JSON.stringify(sanitized, null, 2);
  try {
    const dir = path.dirname(storePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const tempPath = `${storePath}.tmp.${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    fs.writeFileSync(tempPath, jsonContent, "utf-8");
    fs.renameSync(tempPath, storePath);

    if (fs.existsSync(storePath)) {
      global.__devStoreLastMtime = fs.statSync(storePath).mtimeMs;
    }
  } catch {
    try {
      fs.writeFileSync(storePath, jsonContent, "utf-8");
      if (fs.existsSync(storePath)) {
        global.__devStoreLastMtime = fs.statSync(storePath).mtimeMs;
      }
    } catch {
      try {
        const fallbackPath = path.join("/tmp", ".dev-db-store.json");
        fs.writeFileSync(fallbackPath, jsonContent, "utf-8");
      } catch {}
    }
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
          u &&
          ((where.email && u.email?.toLowerCase() === where.email.toLowerCase()) ||
            (where.id && u.id === where.id))
      );
      if (!found) return null;
      const projects = store.projects.filter((p: StoredProject) => p && p.userId === found.id);
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
        (u: StoredUser) => u && ((where.id && u.id === where.id) || (where.email && u.email === where.email))
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
        (u: StoredUser) => u && ((where.id && u.id === where.id) || (where.email && u.email === where.email))
      );
      if (user) {
        store.users = store.users.filter((u: StoredUser) => u && u.id !== user.id);
        const userProjects = store.projects.filter((p: StoredProject) => p && p.userId === user.id);
        const userProjectIds = new Set(userProjects.map((p: StoredProject) => p.id));
        store.projects = store.projects.filter((p: StoredProject) => p && p.userId !== user.id);
        store.mindMapNodes = store.mindMapNodes.filter((n: StoredMindMapNode) => n && !userProjectIds.has(n.projectId));
        store.mindMapEdges = store.mindMapEdges.filter((e: StoredMindMapEdge) => e && !userProjectIds.has(e.projectId));
        store.projectShares = store.projectShares.filter((s: StoredProjectShare) => s && !userProjectIds.has(s.projectId));
        writeDevStore(store);
      }
      return user || null;
    },
  },

  project: {
    async findMany(params?: {
      where?: {
        userId?: string;
        isArchived?: boolean;
        folder?: string;
        title?: { contains?: string; mode?: string };
      };
      orderBy?: { [key: string]: "asc" | "desc" };
      userId?: string;
      isArchived?: boolean;
      folder?: string;
      title?: { contains?: string; mode?: string };
    }): Promise<StoredProject[]> {
      const rawWhere = params?.where || params || {};
      const targetUserId = rawWhere.userId;
      const isArchived = rawWhere.isArchived;
      const folder = rawWhere.folder;
      const titleContains = rawWhere.title?.contains;
      const orderBy = params?.orderBy;

      try {
        if (prisma) {
          const projects = await prisma.project.findMany({
            where: rawWhere as Prisma.ProjectWhereInput,
            orderBy: orderBy as Prisma.ProjectOrderByWithRelationInput,
          });
          return projects as unknown as StoredProject[];
        }
      } catch {}
      const store = readDevStore();
      let projects = store.projects.filter((p: StoredProject) => p && (!targetUserId || p.userId === targetUserId));

      if (isArchived !== undefined) {
        projects = projects.filter((p: StoredProject) => p && p.isArchived === isArchived);
      }
      if (folder) {
        projects = projects.filter((p: StoredProject) => p && p.folder === folder);
      }
      if (titleContains) {
        const query = titleContains.toLowerCase();
        projects = projects.filter((p: StoredProject) => p && p.title && p.title.toLowerCase().includes(query));
      }

      if (orderBy) {
        const [field, dir] = Object.entries(orderBy)[0] as [keyof StoredProject, "asc" | "desc"];
        projects.sort((a, b) => {
          const aVal = a?.[field] ?? "";
          const bVal = b?.[field] ?? "";
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
      const templateData = getTemplateById(template);

      try {
        if (prisma) {
          let nodes = await prisma.mindMapNode.findMany({ where: { projectId } });
          let edges = await prisma.mindMapEdge.findMany({ where: { projectId } });

          if (nodes.length === 0) {
            const rootText = projectTitle && !projectTitle.startsWith("Untitled") ? projectTitle : templateData.rootNode.text;
            const root = await prisma.mindMapNode.create({
              data: {
                projectId,
                parentId: null,
                text: rootText,
                description: templateData.rootNode.desc || "Root concept of your mind map",
                icon: templateData.rootNode.icon || "💡",
                color: templateData.rootNode.color || "#0084ff",
                positionX: 0,
                positionY: 0,
                collapsed: false,
                isRoot: true,
              },
            });

            for (const b of templateData.branches) {
              const child = await prisma.mindMapNode.create({
                data: {
                  projectId,
                  parentId: root.id,
                  text: b.text,
                  description: b.desc || null,
                  icon: b.icon || null,
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

              const subs = b.subs || [];
              for (let j = 0; j < subs.length; j++) {
                const sub = subs[j];
                const subX = b.x > 0 ? b.x + 240 : b.x - 240;
                const subY = b.y + (j === 0 ? -45 : j === 1 ? 0 : 45);

                const subChild = await prisma.mindMapNode.create({
                  data: {
                    projectId,
                    parentId: child.id,
                    text: sub.text,
                    description: sub.desc || null,
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
        const rootText = projectTitle && !projectTitle.startsWith("Untitled") ? projectTitle : templateData.rootNode.text;
        const rootNode: StoredMindMapNode = {
          id: rootId,
          projectId,
          parentId: null,
          text: rootText,
          description: templateData.rootNode.desc || "Root concept of your mind map",
          icon: templateData.rootNode.icon || "💡",
          color: templateData.rootNode.color || "#0084ff",
          positionX: 0,
          positionY: 0,
          collapsed: false,
          isRoot: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        store.mindMapNodes.push(rootNode);

        templateData.branches.forEach((b, i) => {
          const childId = `node_${Date.now()}_${i}`;
          store.mindMapNodes.push({
            id: childId,
            projectId,
            parentId: rootId,
            text: b.text,
            description: b.desc || null,
            icon: b.icon || null,
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

          (b.subs || []).forEach((sub, j) => {
            const subId = `node_${Date.now()}_${i}_${j}`;
            const subX = b.x > 0 ? b.x + 240 : b.x - 240;
            const subY = b.y + (j === 0 ? -45 : j === 1 ? 0 : 45);

            store.mindMapNodes.push({
              id: subId,
              projectId,
              parentId: childId,
              text: sub.text,
              description: sub.desc || null,
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
