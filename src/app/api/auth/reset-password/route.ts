import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { hash } from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";

const schema = z.object({
  token: z.string().min(20).max(200),
  password: z.string().min(12).max(128),
});

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Use a password with at least 12 characters." }, { status: 400 });
  const tokenHash = createHash("sha256").update(parsed.data.token).digest("hex");
  const passwordHash = await hash(parsed.data.password, 12);
  try {
    await db.$transaction(async (tx) => {
      // Conditional update claims the token atomically so it can only be used once.
      const claimed = await tx.passwordResetToken.updateMany({
        where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
        data: { usedAt: new Date() },
      });
      if (claimed.count !== 1) throw new Error("invalid");
      const token = await tx.passwordResetToken.findUniqueOrThrow({ where: { tokenHash } });
      await tx.user.update({ where: { id: token.userId }, data: { passwordHash } });
      await tx.passwordResetToken.deleteMany({ where: { userId: token.userId, usedAt: null } });
    });
  } catch {
    return NextResponse.json(
      { error: "This reset link is invalid or has expired. Please request a new one." },
      { status: 400 },
    );
  }
  return NextResponse.json({ ok: true });
}
