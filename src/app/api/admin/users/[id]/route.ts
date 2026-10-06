import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const actor = await requireAdmin();
  if (!actor)
    return NextResponse.json(
      { error: "Admin access required." },
      { status: 401 },
    );
  const p = z
    .object({ role: z.enum(["ADMIN", "CUSTOMER"]) })
    .safeParse(await request.json().catch(() => null));
  if (!p.success)
    return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  const { id } = await params,
    session = await getServerSession(authOptions);
  if (session?.user.id === id && p.data.role !== "ADMIN")
    return NextResponse.json(
      { error: "You cannot remove your own admin access." },
      { status: 400 },
    );
  if (p.data.role === "CUSTOMER") {
    const count = await db.user.count({ where: { role: "ADMIN" } });
    const target = await db.user.findUnique({
      where: { id },
      select: { role: true },
    });
    if (target?.role === "ADMIN" && count <= 1)
      return NextResponse.json(
        { error: "Keep at least one admin account." },
        { status: 400 },
      );
  }
  return NextResponse.json(
    await db.user.update({
      where: { id },
      data: { role: p.data.role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    }),
  );
}
