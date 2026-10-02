import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
const variant = z.object({ sku: z.string().min(1), price: z.number().positive(), stockQuantity: z.number().int().min(0), attributesJson: z.record(z.string(), z.string()).default({}) });
const product = z.object({ title: z.string().min(2), slug: z.string().min(2).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), description: z.string().default(""), imageUrl: z.string().url().optional().or(z.literal("")), categoryId: z.string().optional(), isPublished: z.boolean().default(false), variants: z.array(variant).min(1) });
export async function POST(request: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Admin access required." }, { status: 401 });
  const parsed = product.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid product details." }, { status: 400 });
  const data = parsed.data;
  const created = await db.product.create({ data: { ...data, imageUrl: data.imageUrl || null, variants: { create: data.variants.map(v => ({ ...v, price: v.price, attributesJson: v.attributesJson })) } }, include: { variants: true } });
  return NextResponse.json(created, { status: 201 });
}
