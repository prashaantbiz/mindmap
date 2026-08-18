import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/prisma";

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = resetPasswordSchema.safeParse(body);

    if (!result.success) {
      const errorMessage = result.error.issues?.[0]?.message || result.error.message || "Validation failed";
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    const { token, password } = result.data;

    // Verify token exists and is valid
    const existingToken = await db.verificationToken.findUnique({
      where: { token },
    });

    if (!existingToken || existingToken.type !== "PASSWORD_RESET") {
      return NextResponse.json(
        { error: "Invalid or expired reset token." },
        { status: 400 }
      );
    }

    const hasExpired = new Date(existingToken.expires) < new Date();
    if (hasExpired) {
      await db.verificationToken.delete({ where: { token } });
      return NextResponse.json(
        { error: "Reset token has expired. Please request a new one." },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { email: existingToken.identifier },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User account associated with this token was not found." },
        { status: 404 }
      );
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 12);

    // Update user password
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // Clean up consumed token
    await db.verificationToken.delete({ where: { token } });

    return NextResponse.json({
      message: "Password reset successful! You can now log in with your new password.",
    });
  } catch (error: any) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Failed to reset password." },
      { status: 500 }
    );
  }
}
