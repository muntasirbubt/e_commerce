import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { productImageUrl } from "@/lib/validation";
const variant = z.object({
  id: z.string().optional(),
  sku: z.string().min(1),
  price: z.number().positive(),
  salePrice: z.number().positive().nullable().optional(),
  stockQuantity: z.number().int().min(0),
  attributesJson: z.record(z.string(), z.string()).default({}),
});
const schema = z.object({
  title: z.string().min(2).optional(),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  description: z.string().optional(),
  imageUrl: productImageUrl.optional().or(z.literal("")),
  media: z
    .array(z.object({ url: productImageUrl, alt: z.string().max(180) }))
    .max(10)
    .optional(),
  categoryId: z.string().nullable().optional(),
  isPublished: z.boolean().optional(),
  isUpcoming: z.boolean().optional(),
  launchAt: z.string().datetime().nullable().optional(),
  seoTitle: z.string().max(70).nullable().optional(),
  seoDescription: z.string().max(180).nullable().optional(),
  specifications: z.record(z.string(), z.string()).optional(),
  variants: z.array(variant).optional(),
});
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Admin access required." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
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
  const { id } = await params,
    d = parsed.data;
  try {
    const product = await db.$transaction(async (tx) => {
      const current = await tx.product.findUnique({
        where: { id },
        include: { variants: true },
      });
      if (!current) throw new Error("Product not found.");
      const updated = await tx.product.update({
        where: { id },
        data: {
          ...(d.title !== undefined ? { title: d.title } : {}),
          ...(d.slug !== undefined ? { slug: d.slug } : {}),
          ...(d.description !== undefined ? { description: d.description } : {}),
          ...(d.imageUrl !== undefined ? { imageUrl: d.imageUrl || null } : {}),
          ...(d.categoryId !== undefined ? { categoryId: d.categoryId } : {}),
          ...(d.isPublished !== undefined ? { isPublished: d.isPublished } : {}),
          ...(d.isUpcoming !== undefined ? { isUpcoming: d.isUpcoming } : {}),
          ...(d.launchAt !== undefined
            ? { launchAt: d.launchAt ? new Date(d.launchAt) : null }
            : {}),
          ...(d.seoTitle !== undefined ? { seoTitle: d.seoTitle } : {}),
          ...(d.seoDescription !== undefined ? { seoDescription: d.seoDescription } : {}),
          ...(d.specifications !== undefined ? { specifications: d.specifications } : {}),
        },
      });
      if (d.media) {
        await tx.productMedia.deleteMany({ where: { productId: id } });
        await tx.productMedia.createMany({
          data: d.media.map((m, position) => ({
            productId: id,
            ...m,
            position,
          })),
        });
        if (d.imageUrl === undefined)
          await tx.product.update({
            where: { id },
            data: { imageUrl: d.media[0]?.url ?? null },
          });
      }
      if (d.variants) {
        for (const v of d.variants) {
          if (v.id) {
            const old = current.variants.find((x) => x.id === v.id);
            if (!old) throw new Error("Variant does not belong to this product.");
            await tx.productVariant.update({
              where: { id: v.id },
              data: {
                sku: v.sku,
                price: v.price,
                salePrice: v.salePrice ?? null,
                attributesJson: v.attributesJson,
                stockQuantity: v.stockQuantity,
              },
            });
            const change = v.stockQuantity - old.stockQuantity;
            if (change)
              await tx.inventoryLog.create({
                data: {
                  variantId: v.id,
                  changeQuantity: change,
                  reason: "Product editor stock adjustment",
                },
              });
          } else {
            const created = await tx.productVariant.create({
              data: {
                productId: id,
                sku: v.sku,
                price: v.price,
                salePrice: v.salePrice ?? null,
                stockQuantity: v.stockQuantity,
                attributesJson: v.attributesJson,
              },
            });
            if (v.stockQuantity)
              await tx.inventoryLog.create({
                data: {
                  variantId: created.id,
                  changeQuantity: v.stockQuantity,
                  reason: "Initial stock via product editor",
                },
              });
          }
        }
      }
      return tx.product.findUniqueOrThrow({
        where: { id },
        include: {
          variants: true,
          media: { orderBy: { position: "asc" } },
          category: true,
        },
      });
    });
    return NextResponse.json(product);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not update product." },
      { status: 400 },
    );
  }
}
