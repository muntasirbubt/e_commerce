import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
const schema = z.object({ title: z.string().min(2), slug: z.string().min(2).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), description: z.string(), imageUrl: z.string().url().optional().or(z.literal("")), categoryId: z.string().nullable().optional(), isPublished: z.boolean() });
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Admin access required." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid product details." }, { status: 400 });
  const { id } = await params; const data = parsed.data;
  return NextResponse.json(await db.product.update({ where: { id }, data: { ...data, imageUrl: data.imageUrl || null } }));
}
