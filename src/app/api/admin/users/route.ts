import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { hash } from "bcryptjs";
import { z } from "zod";
export async function GET() {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Admin access required." }, { status: 401 });
  return NextResponse.json(
    await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  );
}

const createSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254),
  password: z.string().min(12).max(128),
  role: z.enum(["ADMIN", "STAFF", "CUSTOMER"]),
});

export async function POST(request: Request) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Admin access required." }, { status: 401 });
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Enter a valid name, email, role, and password with at least 12 characters." },
      { status: 400 },
    );
  try {
    const { name, email, password, role } = parsed.data;
    const user = await db.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        role,
        passwordHash: await hash(password, 12),
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    return NextResponse.json(user, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 },
    );
  }
}
