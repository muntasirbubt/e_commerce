import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { appUrl, sendPasswordResetEmail } from "@/lib/mail";

const schema = z.object({ email: z.string().email().max(254) });
const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const MIN_INTERVAL_MS = 60 * 1000; // at most one reset email per minute per account

/**
 * Always responds with the same message so the endpoint can't be used to
 * discover which emails have accounts.
 */
export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  const ok = NextResponse.json({
    ok: true,
    message: "If an account exists for that email, a reset link is on its way.",
  });
  const user = await db.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!user) return ok;
  const recent = await db.passwordResetToken.findFirst({
    where: { userId: user.id, createdAt: { gt: new Date(Date.now() - MIN_INTERVAL_MS) } },
  });
  if (recent) return ok;
  const token = randomBytes(32).toString("base64url");
  await db.$transaction([
    // Only the newest link stays valid.
    db.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } }),
    db.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: createHash("sha256").update(token).digest("hex"),
        expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
      },
    }),
  ]);
  await sendPasswordResetEmail(user, appUrl(`/reset-password?token=${token}`));
  return ok;
}
