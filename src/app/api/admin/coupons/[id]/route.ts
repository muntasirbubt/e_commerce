import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireAdmin()))
    return NextResponse.json(
      { error: "Admin access required." },
      { status: 401 },
    );
  const p = z
    .object({ active: z.boolean() })
    .safeParse(await request.json().catch(() => null));
  if (!p.success)
    return NextResponse.json(
      { error: "Invalid coupon state." },
      { status: 400 },
    );
  const { id } = await params;
  return NextResponse.json(
    await db.coupon.update({ where: { id }, data: { active: p.data.active } }),
  );
}
