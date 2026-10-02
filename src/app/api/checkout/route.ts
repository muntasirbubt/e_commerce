import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { getStoreSettings } from "@/lib/config";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const schema = z.object({ customerName: z.string().min(1), customerEmail: z.string().email(), address: z.object({ line1: z.string().min(1), line2: z.string().optional(), city: z.string().min(1), region: z.string().min(1), postalCode: z.string().min(1), country: z.string().min(2) }), paymentMethod: z.string(), items: z.array(z.object({ variantId: z.string(), quantity: z.number().int().positive().max(50) })).min(1).max(100) });

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please check the checkout details." }, { status: 400 });
  const input = parsed.data;
  const settings = await getStoreSettings();
  const providers = settings.activePaymentProviders.filter(p => p === "stripe" ? settings.gatewayEnabled && Boolean(process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) : p !== "paypal");
  if (!providers.includes(input.paymentMethod)) return NextResponse.json({ error: "That payment method is not available." }, { status: 400 });
  if (input.paymentMethod === "stripe" && (!settings.gatewayEnabled || !process.env.STRIPE_SECRET_KEY)) return NextResponse.json({ error: "Card checkout is not configured." }, { status: 400 });
  const aggregated = new Map<string, number>();
  input.items.forEach(item => aggregated.set(item.variantId, (aggregated.get(item.variantId) ?? 0) + item.quantity));
  const quantities = [...aggregated.entries()];
  const session = await getServerSession(authOptions);
  const orderNumber = `MM-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 5).toUpperCase()}`;
  let createdOrderId: string | undefined;
  try {
    const created = await db.$transaction(async tx => {
      const variants = await tx.productVariant.findMany({ where: { id: { in: quantities.map(([id]) => id) }, product: { isPublished: true } }, include: { product: true } });
      if (variants.length !== quantities.length) throw new Error("One or more items are no longer available.");
      const byId = new Map(variants.map(v => [v.id, v]));
      let subtotal = 0;
      for (const [id, quantity] of quantities) {
        const variant = byId.get(id)!;
        const updated = await tx.productVariant.updateMany({ where: { id, stockQuantity: { gte: quantity } }, data: { stockQuantity: { decrement: quantity } } });
        if (updated.count !== 1) throw new Error(`${variant.product.title} does not have enough stock.`);
        await tx.inventoryLog.create({ data: { variantId: id, changeQuantity: -quantity, reason: `Order ${orderNumber}` } });
        subtotal += Number(variant.price) * quantity;
      }
      const order = await tx.order.create({ data: { orderNumber, userId: session?.user.id, customerName: input.customerName, customerEmail: input.customerEmail, totalAmount: subtotal + settings.shippingFee, shippingAmount: settings.shippingFee, paymentMethod: input.paymentMethod, paymentStatus: input.paymentMethod === "stripe" ? "PENDING" : "UNPAID", shippingAddress: input.address, items: { create: quantities.map(([variantId, quantity]) => ({ variantId, quantity, price: byId.get(variantId)!.price })) } } });
      return { order, lines: quantities.map(([variantId, quantity]) => ({ variant: byId.get(variantId)!, quantity })) };
    });
    createdOrderId = created.order.id;
    if (input.paymentMethod === "stripe") {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      const checkout = await stripe.checkout.sessions.create({ mode: "payment", customer_email: input.customerEmail, success_url: `${request.nextUrl.origin}/checkout/success?order=${encodeURIComponent(orderNumber)}`, cancel_url: `${request.nextUrl.origin}/checkout?cancelled=1`, metadata: { orderId: created.order.id }, line_items: [...created.lines.map(({ variant, quantity }) => ({ quantity, price_data: { currency: settings.currency.toLowerCase(), unit_amount: Math.round(Number(variant.price) * 100), product_data: { name: variant.product.title, description: variant.sku } } })), ...(settings.shippingFee > 0 ? [{ quantity: 1, price_data: { currency: settings.currency.toLowerCase(), unit_amount: Math.round(settings.shippingFee * 100), product_data: { name: "Shipping" } } }] : [])] });
      await db.order.update({ where: { id: created.order.id }, data: { paymentReference: checkout.id } });
      return NextResponse.json({ orderNumber, checkoutUrl: checkout.url });
    }
    return NextResponse.json({ orderNumber, message: "Order received" }, { status: 201 });
  } catch (error) {
    if (createdOrderId) await db.$transaction(async tx => {
      const order = await tx.order.findFirst({ where: { id: createdOrderId, paymentStatus: "PENDING" }, include: { items: true } });
      if (!order) return;
      await tx.order.update({ where: { id: order.id }, data: { paymentStatus: "FAILED", status: "CANCELLED" } });
      for (const item of order.items) { await tx.productVariant.update({ where: { id: item.variantId }, data: { stockQuantity: { increment: item.quantity } } }); await tx.inventoryLog.create({ data: { variantId: item.variantId, changeQuantity: item.quantity, reason: `Checkout initialization failed ${order.orderNumber}` } }); }
    });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not place order." }, { status: 409 });
  }
}
