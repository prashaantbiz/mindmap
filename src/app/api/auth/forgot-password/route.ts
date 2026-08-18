import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/prisma";
import { generatePasswordResetToken } from "@/lib/tokens";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = forgotPasswordSchema.safeParse(body);

    if (!result.success) {
      const errorMessage = result.error.issues?.[0]?.message || result.error.message || "Invalid email";
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    const { email } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      // Return success message anyway to prevent user enumeration attacks
      return NextResponse.json({
        message: "If an account with that email exists, a password reset link has been generated.",
      });
    }

    const resetToken = await generatePasswordResetToken(normalizedEmail);

    return NextResponse.json({
      message: "Password reset link generated successfully.",
      resetToken: resetToken.token,
      resetUrl: `/reset-password?token=${resetToken.token}`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Password reset error";
    console.error("Forgot password error:", message);
    return NextResponse.json(
      { error: "Failed to generate password reset request." },
      { status: 500 }
    );
  }
}
