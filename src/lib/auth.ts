import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { db, StoredProject, StoredUser } from "@/lib/prisma";

const isGoogleOAuthReal = Boolean(
  process.env.GOOGLE_CLIENT_ID &&
    !process.env.GOOGLE_CLIENT_ID.includes("placeholder") &&
    process.env.GOOGLE_CLIENT_ID.trim() !== ""
);

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || "dev-super-secret-key-change-this-in-production-123456789",
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    ...(isGoogleOAuthReal
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
          }),
        ]
      : []),

    // Mock Google OAuth Provider for Seamless Local Development
    CredentialsProvider({
      id: "google-mock",
      name: "Google Mock",
      credentials: {
        email: { label: "Email", type: "email" },
        name: { label: "Name", type: "text" },
        image: { label: "Image", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          throw new Error("Email is required for Google Sign-In.");
        }

        const email = credentials.email.trim().toLowerCase();
        let user: any = await db.user.findUnique({
          where: { email },
        });

        if (!user) {
          user = await db.user.create({
            data: {
              name: credentials.name || email.split("@")[0],
              email,
              image: credentials.image || "https://lh3.googleusercontent.com/a/default-user",
              emailVerified: new Date(),
            },
          });

          // Auto-provision initial workspace
          await db.project.create({
            data: {
              title: `${credentials.name || email.split("@")[0]}'s Mind Map`,
              description: "Default auto-provisioned mind map canvas",
              nodeCount: 5,
              folder: "Personal",
              tags: ["Starter", "Ideas"],
              isDefault: true,
              userId: user.id,
            },
          });
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),

    // Standard Email & Password Credentials Provider
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please provide both email and password.");
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        if (!user || !user.passwordHash) {
          throw new Error("Invalid email or password.");
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) {
          throw new Error("Invalid email or password.");
        }

        // Auto-provision default workspace if not present
        const projects = await db.project.findMany({
          where: { userId: user.id },
        });

        if (projects.length === 0) {
          await db.project.create({
            data: {
              title: "Personal Mind Map",
              description: "Default auto-provisioned mind map canvas",
              nodeCount: 5,
              folder: "Personal",
              tags: ["Starter", "Ideas"],
              isDefault: true,
              userId: user.id,
            },
          });
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user.email) return false;

        // Check if user exists
        let existingUser: any = await db.user.findUnique({
          where: { email: user.email.toLowerCase() },
        });

        if (!existingUser) {
          // Auto create user
          existingUser = await db.user.create({
            data: {
              name: user.name || "User",
              email: user.email.toLowerCase(),
              image: user.image,
              emailVerified: new Date(),
            },
          });

          // Auto-provision default workspace
          if (existingUser) {
            await db.project.create({
              data: {
                title: `${user.name || "Personal"}'s Mind Map`,
                description: "Default auto-provisioned mind map canvas",
                nodeCount: 5,
                folder: "Personal",
                tags: ["Starter", "Ideas"],
                isDefault: true,
                userId: existingUser.id,
              },
            });
          }
        }
        if (existingUser) {
          user.id = existingUser.id;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string | null;

        if (token.id) {
          const projects = await db.project.findMany({
            where: { userId: token.id as string },
          });
          (session.user as any).projects = projects;
          (session.user as { id?: string; email?: string | null; name?: string | null; image?: string | null; projects?: StoredProject[]; defaultProject?: StoredProject | null }).defaultProject = projects.find((p: StoredProject) => p.isDefault) || projects[0] || null;
        }
      }
      return session;
    },
  },
};

export async function getOrCreateAuthenticatedUser(sessionUser: {
  email?: string | null;
  name?: string | null;
  image?: string | null;
  id?: string | null;
}): Promise<StoredUser | null> {
  if (!sessionUser?.email) return null;
  const normalizedEmail = sessionUser.email.toLowerCase().trim();

  let user = await db.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    user = await db.user.create({
      data: {
        name: sessionUser.name || normalizedEmail.split("@")[0],
        email: normalizedEmail,
        image: sessionUser.image || `https://api.dicebear.com/7.x/initials/svg?seed=${sessionUser.name || "User"}`,
        emailVerified: new Date(),
      },
    });

    // Auto-provision initial workspace
    await db.project.create({
      data: {
        title: `${sessionUser.name || "My"}'s Mind Map`,
        description: "Explore ideas, connect nodes, and organize your thoughts.",
        nodeCount: 5,
        folder: "Personal",
        tags: ["Starter", "Ideas"],
        isDefault: true,
        userId: user.id,
      },
    });
  }

  return user;
}
