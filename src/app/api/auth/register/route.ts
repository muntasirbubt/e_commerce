import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { sendWelcomeEmail } from "@/lib/mail";
const schema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().max(254),
  password: z.string().min(12).max(128),
});
export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      {
        error: "Use a valid email and a password with at least 12 characters.",
      },
      { status: 400 },
    );
  const { name, email, password } = parsed.data;
  try {
    await db.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash: await hash(password, 12),
        role: "CUSTOMER",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "An account with this email may already exist." },
      { status: 409 },
    );
  }
  await sendWelcomeEmail({ name, email: email.toLowerCase() });
  return NextResponse.json({ ok: true }, { status: 201 });
}
