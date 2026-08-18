import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/prisma";

const verifyEmailSchema = z.object({
  token: z.string().min(1, "Verification token is required"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = verifyEmailSchema.safeParse(body);

    if (!result.success) {
      const errorMessage = result.error.issues?.[0]?.message || result.error.message || "Invalid request";
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    const { token } = result.data;

    const existingToken = await db.verificationToken.findUnique({
      where: { token },
    });

    if (!existingToken || existingToken.type !== "EMAIL_VERIFICATION") {
      return NextResponse.json(
        { error: "Invalid or expired verification token." },
        { status: 400 }
      );
    }

    const hasExpired = new Date(existingToken.expires) < new Date();
    if (hasExpired) {
      await db.verificationToken.delete({ where: { token } });
      return NextResponse.json(
        { error: "Verification link has expired. Please sign up or request a new link." },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { email: existingToken.identifier },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User associated with this token does not exist." },
        { status: 404 }
      );
    }

    // Mark email as verified
    await db.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });

    // Remove verification token
    await db.verificationToken.delete({ where: { token } });

    return NextResponse.json({
      message: "Email verified successfully! You can now access all features.",
      email: user.email,
    });
  } catch (error: any) {
    console.error("Verify email error:", error);
    return NextResponse.json(
      { error: "Failed to verify email address." },
      { status: 500 }
    );
  }
}
