import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/prisma";
import { generateVerificationToken } from "@/lib/tokens";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = signupSchema.safeParse(body);

    if (!result.success) {
      const errorMessage = result.error.issues?.[0]?.message || result.error.message || "Validation failed";
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    const { name, email, password } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email address already exists." },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user in database
    const newUser = await db.user.create({
      data: {
        name,
        email: normalizedEmail,
        passwordHash,
      },
    });

    // Auto-provision default mind map project for user
    const defaultProject = await db.project.create({
      data: {
        title: "My First Mind Map",
        description: "Explore ideas, connect nodes, and organize your thoughts.",
        nodeCount: 6,
        folder: "Personal",
        tags: ["Starter", "Brainstorm"],
        isDefault: true,
        userId: newUser.id,
      },
    });

    // Generate email verification token
    const verificationToken = await generateVerificationToken(normalizedEmail);

    return NextResponse.json(
      {
        message: "User created successfully with default workspace.",
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
        },
        defaultProject,
        verificationToken: verificationToken.token,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Registration error";
    console.error("Signup error:", message);
    return NextResponse.json(
      { error: "Something went wrong during registration. Please try again." },
      { status: 500 }
    );
  }
}
