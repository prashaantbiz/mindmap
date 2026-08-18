import crypto from "crypto";
import { db } from "./prisma";

export async function generateVerificationToken(email: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const verificationToken = await db.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
      type: "EMAIL_VERIFICATION",
    },
  });

  return verificationToken;
}

export async function generatePasswordResetToken(email: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

  const resetToken = await db.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
      type: "PASSWORD_RESET",
    },
  });

  return resetToken;
}
