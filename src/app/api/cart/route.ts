import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
export async function POST(request: NextRequest) {
  const body = z
    .object({
      items: z
        .array(
          z.object({
            variantId: z.string(),
            quantity: z.number().int().positive(),
          }),
        )
        .max(100),
    })
    .safeParse(await request.json().catch(() => null));
  if (!body.success)
    return NextResponse.json({ error: "Invalid cart." }, { status: 400 });
  const ids = body.data.items.map((x) => x.variantId);
  const variants = await db.productVariant.findMany({
    where: { id: { in: ids }, product: { isPublished: true } },
    include: { product: { select: { title: true } } },
  });
  return NextResponse.json({
    items: variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      stockQuantity: v.stockQuantity,
      price: Number(v.price),
      salePrice: v.salePrice ? Number(v.salePrice) : null,
      attributesJson: v.attributesJson,
      product: v.product,
    })),
  });
}
