import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/admin";
import { sendOrderStatusUpdate } from "@/lib/mail";

const schema = z.object({
  status: z.enum(["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]).optional(),
  items: z
    .array(
      z.object({
        variantId: z.string().min(1),
        quantity: z.number().int().positive().max(50),
        price: z.number().nonnegative(),
      }),
    )
    .min(1)
    .max(100)
    .optional(),
  shippingAddress: z
    .object({
      line1: z.string().min(1),
      line2: z.string().optional(),
      city: z.string().min(1),
      region: z.string().min(1),
      postalCode: z.string().min(1),
      country: z.string().min(2),
      landmark: z.string().optional(),
      deliveryNotes: z.string().optional(),
    })
    .optional(),
  discountAmount: z.number().nonnegative().optional(),
  shippingAmount: z.number().nonnegative().optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireStaff();
  if (!actor) return NextResponse.json({ error: "Admin access required." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      {
        error: "Invalid order update.",
        details: parsed.error.issues.map((issue) => issue.message),
      },
      { status: 400 },
    );
  const { id } = await params;
  let previousStatus: string | undefined;
  try {
    const updated = await db.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id }, include: { items: true } });
      if (!order) throw new Error("Order not found.");
      previousStatus = order.status;
      const data = parsed.data;
      if (actor.role === "STAFF") {
        const body = parsed.data;
        if (
          Object.keys(body).some((key) => key !== "status") ||
          !body.status ||
          body.status === "CANCELLED"
        )
          throw new Error(
            "Staff can update fulfillment status only. Admin access is required for order edits and cancellation.",
          );
        const allowedNext: Record<string, string> = {
          PENDING: "PROCESSING",
          PROCESSING: "SHIPPED",
          SHIPPED: "DELIVERED",
        };
        if (allowedNext[order.status] !== body.status)
          throw new Error("Move the order to the next fulfillment step only.");
        const paymentStatus =
          body.status === "DELIVERED" && order.paymentMethod === "cod"
            ? "PAID"
            : order.paymentStatus;
        const result = await tx.order.update({
          where: { id },
          data: { status: body.status, paymentStatus },
          select: { id: true, orderNumber: true, status: true },
        });
        return result;
      }
      if (data.status === "CANCELLED" && order.status !== "CANCELLED") {
        if (order.paymentStatus === "PAID")
          throw new Error("This order is paid. Record the refund before cancelling it.");
        for (const item of order.items) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stockQuantity: { increment: item.quantity } },
          });
          await tx.inventoryLog.create({
            data: {
              variantId: item.variantId,
              changeQuantity: item.quantity,
              reason: `Cancelled order ${order.orderNumber}`,
            },
          });
        }
        if (order.couponId)
          await tx.coupon.update({
            where: { id: order.couponId },
            data: { redemptionCount: { decrement: 1 } },
          });
        return tx.order.update({
          where: { id },
          data: {
            status: "CANCELLED",
            paymentStatus: order.paymentStatus === "PENDING" ? "FAILED" : order.paymentStatus,
          },
        });
      }
      if (
        (data.items ||
          data.discountAmount !== undefined ||
          data.shippingAmount !== undefined ||
          data.shippingAddress) &&
        (order.status === "DELIVERED" ||
          order.status === "CANCELLED" ||
          order.paymentStatus === "PAID")
      ) {
        throw new Error("Only unpaid, open orders can be edited.");
      }
      let itemSubtotal =
        Number(order.totalAmount) + Number(order.discountAmount) - Number(order.shippingAmount);
      if (data.items) {
        const requested = new Map<string, { quantity: number; price: number }>();
        for (const line of data.items) {
          const old = requested.get(line.variantId);
          requested.set(line.variantId, {
            quantity: line.quantity + (old?.quantity ?? 0),
            price: line.price,
          });
        }
        const oldQty = new Map<string, number>();
        for (const line of order.items)
          oldQty.set(line.variantId, (oldQty.get(line.variantId) ?? 0) + line.quantity);
        const allIds = [...new Set([...oldQty.keys(), ...requested.keys()])];
        const variants = await tx.productVariant.findMany({ where: { id: { in: allIds } } });
        if (variants.length !== allIds.length)
          throw new Error("An order item is no longer available.");
        for (const variantId of allIds) {
          const delta = (requested.get(variantId)?.quantity ?? 0) - (oldQty.get(variantId) ?? 0);
          if (delta > 0) {
            const changed = await tx.productVariant.updateMany({
              where: { id: variantId, stockQuantity: { gte: delta } },
              data: { stockQuantity: { decrement: delta } },
            });
            if (changed.count !== 1)
              throw new Error(
                `Not enough stock for ${variants.find((v) => v.id === variantId)?.sku}.`,
              );
          } else if (delta < 0) {
            await tx.productVariant.update({
              where: { id: variantId },
              data: { stockQuantity: { increment: -delta } },
            });
          }
          if (delta !== 0)
            await tx.inventoryLog.create({
              data: {
                variantId,
                changeQuantity: -delta,
                reason: `Order ${order.orderNumber} edited`,
              },
            });
        }
        await tx.orderItem.deleteMany({ where: { orderId: id } });
        await tx.orderItem.createMany({
          data: [...requested].map(([variantId, line]) => ({
            orderId: id,
            variantId,
            quantity: line.quantity,
            price: line.price,
          })),
        });
        itemSubtotal = [...requested.values()].reduce(
          (sum, item) => sum + item.quantity * item.price,
          0,
        );
      }
      const discountAmount = data.discountAmount ?? Number(order.discountAmount);
      const shippingAmount = data.shippingAmount ?? Number(order.shippingAmount);
      if (discountAmount > itemSubtotal)
        throw new Error("Discount cannot exceed the item subtotal.");
      const totalAmount = Math.round((itemSubtotal - discountAmount + shippingAmount) * 100) / 100;
      const status = data.status ?? order.status;
      const paymentStatus =
        status === "DELIVERED" && order.paymentMethod === "cod" ? "PAID" : order.paymentStatus;
      return tx.order.update({
        where: { id },
        data: {
          status,
          paymentStatus,
          totalAmount,
          discountAmount,
          shippingAmount,
          ...(data.shippingAddress ? { shippingAddress: data.shippingAddress } : {}),
        },
      });
    });
    const current = await db.order.findUnique({
      where: { id },
      select: { orderNumber: true, customerName: true, customerEmail: true, status: true },
    });
    if (current && previousStatus && current.status !== previousStatus)
      await sendOrderStatusUpdate(current);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Order update failed." },
      { status: 400 },
    );
  }
}
