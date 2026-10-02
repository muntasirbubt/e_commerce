import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
const schema = z.object({ status: z.enum(["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]) });
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Admin access required." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid order status." }, { status: 400 });
  const { id } = await params;
  try {
    const updated = await db.$transaction(async tx => {
      const order = await tx.order.findUnique({ where: { id }, include: { items: true } });
      if (!order) throw new Error("Order not found.");
      if (parsed.data.status === "CANCELLED" && order.status !== "CANCELLED" && order.paymentStatus !== "PAID") {
        for (const item of order.items) { await tx.productVariant.update({ where: { id: item.variantId }, data: { stockQuantity: { increment: item.quantity } } }); await tx.inventoryLog.create({ data: { variantId: item.variantId, changeQuantity: item.quantity, reason: `Cancelled order ${order.orderNumber}` } }); }
        return tx.order.update({ where: { id }, data: { status: "CANCELLED", paymentStatus: order.paymentStatus === "PENDING" ? "FAILED" : order.paymentStatus } });
      }
      return tx.order.update({ where: { id }, data: { status: parsed.data.status } });
    });
    return NextResponse.json(updated);
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Order update failed." }, { status: 400 }); }
}
