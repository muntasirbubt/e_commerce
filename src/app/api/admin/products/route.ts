import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { productImageUrl } from "@/lib/validation";
const variant = z
  .object({
    sku: z.string().min(1),
    price: z.number().positive(),
    salePrice: z.number().positive().nullable().optional(),
    stockQuantity: z.number().int().min(0),
    attributesJson: z.record(z.string(), z.string()).default({}),
  })
  .superRefine((v, ctx) => {
    if (v.salePrice !== undefined && v.salePrice !== null && v.salePrice >= v.price)
      ctx.addIssue({
        code: "custom",
        message: "Sale price must be below regular price.",
        path: ["salePrice"],
      });
  });
const product = z.object({
  title: z.string().min(2),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().default(""),
  imageUrl: productImageUrl.optional().or(z.literal("")),
  media: z
    .array(z.object({ url: productImageUrl, alt: z.string().max(180) }))
    .max(10)
    .default([]),
  categoryId: z.string().nullable().optional(),
  isPublished: z.boolean().default(false),
  isUpcoming: z.boolean().default(false),
  launchAt: z.string().datetime().nullable().optional(),
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(180).optional(),
  specifications: z.record(z.string(), z.string()).default({}),
  variants: z.array(variant).min(1),
});
export async function POST(request: NextRequest) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Admin access required." }, { status: 401 });
  const parsed = product.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      {
        error: "Invalid product details.",
        details: parsed.error.issues.map(
          (issue) => `${issue.path.join(".") || "Product"}: ${issue.message}`,
        ),
      },
      { status: 400 },
    );
  const data = parsed.data;
  const created = await db.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        title: data.title,
        slug: data.slug,
        description: data.description,
        imageUrl: data.imageUrl || data.media[0]?.url || null,
        categoryId: data.categoryId || null,
        isPublished: data.isPublished,
        isUpcoming: data.isUpcoming,
        launchAt: data.launchAt ? new Date(data.launchAt) : null,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        specifications: data.specifications,
        variants: {
          create: data.variants.map((v) => ({
            ...v,
            attributesJson: v.attributesJson,
          })),
        },
        media: {
          create: data.media.map((m, position) => ({ ...m, position })),
        },
      },
      include: { variants: true, media: true, category: true },
    });
    for (const v of product.variants)
      if (v.stockQuantity)
        await tx.inventoryLog.create({
          data: {
            variantId: v.id,
            changeQuantity: v.stockQuantity,
            reason: "Initial stock via product creation",
          },
        });
    return product;
  });
  return NextResponse.json(created, { status: 201 });
}
