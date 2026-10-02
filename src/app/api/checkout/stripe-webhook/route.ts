import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
export async function POST(request: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const body = await request.text();
  let event: Stripe.Event;
  try { event = stripe.webhooks.constructEvent(body, request.headers.get("stripe-signature") ?? "", process.env.STRIPE_WEBHOOK_SECRET); } catch { return NextResponse.json({ error: "Invalid signature." }, { status: 400 }); }
  if (event.type === "checkout.session.completed") {
    const checkout = event.data.object as Stripe.Checkout.Session;
    if (checkout.metadata?.orderId) await db.order.updateMany({ where: { id: checkout.metadata.orderId, paymentStatus: "PENDING" }, data: { paymentStatus: "PAID", status: "PROCESSING" } });
  } else if (event.type === "checkout.session.expired") {
    const checkout = event.data.object as Stripe.Checkout.Session;
    const orderId = checkout.metadata?.orderId;
    if (orderId) await db.$transaction(async tx => {
      const order = await tx.order.findFirst({ where: { id: orderId, paymentStatus: "PENDING" }, include: { items: true } });
      if (!order) return;
      await tx.order.update({ where: { id: order.id }, data: { paymentStatus: "FAILED", status: "CANCELLED" } });
      for (const item of order.items) { await tx.productVariant.update({ where: { id: item.variantId }, data: { stockQuantity: { increment: item.quantity } } }); await tx.inventoryLog.create({ data: { variantId: item.variantId, changeQuantity: item.quantity, reason: `Expired payment ${order.orderNumber}` } }); }
    });
  }
  return NextResponse.json({ received: true });
}
