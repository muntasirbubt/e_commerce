import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
const schema = z.object({
  variantId: z.string(),
  changeQuantity: z
    .number()
    .int()
    .refine((n) => n !== 0),
  reason: z.string().min(3).max(200),
});
export async function POST(request: NextRequest) {
  if (!(await requireAdmin()))
    return NextResponse.json(
      { error: "Admin access required." },
      { status: 401 },
    );
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Invalid inventory adjustment." },
      { status: 400 },
    );
  const { variantId, changeQuantity, reason } = parsed.data;
  try {
    const result = await db.$transaction(async (tx) => {
      const variant = await tx.productVariant.findUnique({
        where: { id: variantId },
      });
      if (!variant) throw new Error("Variant not found.");
      const stockQuantity = variant.stockQuantity + changeQuantity;
      if (stockQuantity < 0) throw new Error("Inventory cannot be negative.");
      await tx.productVariant.update({
        where: { id: variantId },
        data: { stockQuantity },
      });
      await tx.inventoryLog.create({
        data: { variantId, changeQuantity, reason },
      });
      return { stockQuantity };
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Update failed." },
      { status: 400 },
    );
  }
}
