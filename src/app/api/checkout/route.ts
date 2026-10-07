import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { computeShipping, getStoreSettings } from "@/lib/config";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendOrderConfirmation } from "@/lib/mail";

const schema = z.object({
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  customerPhone: z
    .string()
    .trim()
    .regex(/^\+?[0-9][0-9\s().-]{6,19}$/, "Enter a valid phone number."),
  address: z.object({
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    region: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.string().min(2),
    landmark: z.string().max(180).optional(),
    deliveryNotes: z.string().max(500).optional(),
  }),
  paymentMethod: z.string(),
  couponCode: z.string().max(40).optional(),
  items: z
    .array(
      z.object({
        variantId: z.string(),
        quantity: z.number().int().positive().max(50),
      }),
    )
    .min(1)
    .max(100),
});

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Please check the checkout details." }, { status: 400 });
  const input = parsed.data;
  const settings = await getStoreSettings();
  const providers = settings.activePaymentProviders.filter((p) =>
    p === "stripe"
      ? settings.gatewayEnabled &&
        Boolean(process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
      : p !== "paypal",
  );
  if (!providers.includes(input.paymentMethod))
    return NextResponse.json({ error: "That payment method is not available." }, { status: 400 });
  if (
    input.paymentMethod === "stripe" &&
    (!settings.gatewayEnabled || !process.env.STRIPE_SECRET_KEY)
  )
    return NextResponse.json({ error: "Card checkout is not configured." }, { status: 400 });
  const aggregated = new Map<string, number>();
  input.items.forEach((item) =>
    aggregated.set(item.variantId, (aggregated.get(item.variantId) ?? 0) + item.quantity),
  );
  const quantities = [...aggregated.entries()];
  const session = await getServerSession(authOptions);
  const orderNumber = `MM-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 5).toUpperCase()}`;
  let createdOrderId: string | undefined;
  try {
    const created = await db.$transaction(async (tx) => {
      const variants = await tx.productVariant.findMany({
        where: {
          id: { in: quantities.map(([id]) => id) },
          product: { isPublished: true },
        },
        include: { product: true },
      });
      if (variants.length !== quantities.length)
        throw new Error("One or more items are no longer available.");
      const byId = new Map(variants.map((v) => [v.id, v]));
      let subtotal = 0;
      const unitPrices = new Map<string, number>();
      for (const [id, quantity] of quantities) {
        const variant = byId.get(id)!;
        const updated = await tx.productVariant.updateMany({
          where: { id, stockQuantity: { gte: quantity } },
          data: { stockQuantity: { decrement: quantity } },
        });
        if (updated.count !== 1)
          throw new Error(`${variant.product.title} does not have enough stock.`);
        await tx.inventoryLog.create({
          data: {
            variantId: id,
            changeQuantity: -quantity,
            reason: `Order ${orderNumber}`,
          },
        });
        const unitPrice =
          variant.salePrice && Number(variant.salePrice) < Number(variant.price)
            ? Number(variant.salePrice)
            : Number(variant.price);
        unitPrices.set(id, unitPrice);
        subtotal += unitPrice * quantity;
      }
      let discountAmount = 0,
        couponId: string | undefined,
        couponCode: string | undefined;
      if (input.couponCode) {
        const coupon = await tx.coupon.findUnique({
          where: { code: input.couponCode.trim().toUpperCase() },
        });
        const now = new Date();
        if (
          !coupon ||
          !coupon.active ||
          (coupon.startsAt && coupon.startsAt > now) ||
          (coupon.endsAt && coupon.endsAt < now) ||
          (coupon.maxRedemptions !== null && coupon.redemptionCount >= coupon.maxRedemptions)
        )
          throw new Error("That promo code is invalid or no longer active.");
        discountAmount = Math.min(
          subtotal,
          coupon.discountType === "PERCENTAGE"
            ? (subtotal * Number(coupon.amount)) / 100
            : Number(coupon.amount),
        );
        discountAmount = Math.round(discountAmount * 100) / 100;
        if (discountAmount <= 0) throw new Error("This order does not qualify for that code.");
        const redeemed = await tx.coupon.updateMany({
          where: {
            id: coupon.id,
            active: true,
            ...(coupon.maxRedemptions !== null
              ? { redemptionCount: { lt: coupon.maxRedemptions } }
              : {}),
          },
          data: { redemptionCount: { increment: 1 } },
        });
        if (redeemed.count !== 1)
          throw new Error("That promo code has reached its redemption limit.");
        couponId = coupon.id;
        couponCode = coupon.code;
      }
      const shippingAmount = computeShipping(subtotal - discountAmount, settings);
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: session?.user.id,
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          customerPhone: input.customerPhone,
          totalAmount: subtotal - discountAmount + shippingAmount,
          shippingAmount,
          discountAmount,
          couponId,
          couponCode,
          paymentMethod: input.paymentMethod,
          paymentStatus: input.paymentMethod === "stripe" ? "PENDING" : "UNPAID",
          shippingAddress: input.address,
          items: {
            create: quantities.map(([variantId, quantity]) => ({
              variantId,
              quantity,
              price: unitPrices.get(variantId)!,
            })),
          },
        },
      });
      const rawLineCents = quantities.map(([id, q]) => Math.round(unitPrices.get(id)! * q * 100));
      const subtotalCents = rawLineCents.reduce((a, b) => a + b, 0);
      const discountCents = Math.round(discountAmount * 100);
      const allocations = rawLineCents.map((x) =>
        subtotalCents ? Math.floor((discountCents * x) / subtotalCents) : 0,
      );
      let remainder = discountCents - allocations.reduce((a, b) => a + b, 0);
      for (let i = 0; remainder > 0 && i < allocations.length; i++) {
        if (allocations[i] < rawLineCents[i]) {
          allocations[i]++;
          remainder--;
        }
      }
      const stripeLines = quantities.map(([variantId, quantity], i) => ({
        quantity: 1,
        price_data: {
          currency: settings.currency.toLowerCase(),
          unit_amount: Math.max(0, rawLineCents[i] - allocations[i]),
          product_data: {
            name: `${byId.get(variantId)!.product.title} · Qty ${quantity}`,
            description: byId.get(variantId)!.sku,
          },
        },
      }));
      if (shippingAmount > 0)
        stripeLines.push({
          quantity: 1,
          price_data: {
            currency: settings.currency.toLowerCase(),
            unit_amount: Math.round(shippingAmount * 100),
            product_data: { name: "Shipping", description: "Delivery fee" },
          },
        });
      const mailItems = quantities.map(([variantId, quantity]) => ({
        quantity,
        price: unitPrices.get(variantId)!,
        title: byId.get(variantId)!.product.title,
        sku: byId.get(variantId)!.sku,
      }));
      return { order, stripeLines, mailItems };
    });
    createdOrderId = created.order.id;
    if (input.paymentMethod === "stripe") {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      const checkout = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: input.customerEmail,
        success_url: `${request.nextUrl.origin}/checkout/success?order=${encodeURIComponent(orderNumber)}`,
        cancel_url: `${request.nextUrl.origin}/checkout?cancelled=1`,
        metadata: { orderId: created.order.id },
        line_items: created.stripeLines,
      });
      await db.order.update({
        where: { id: created.order.id },
        data: { paymentReference: checkout.id },
      });
      return NextResponse.json({ orderNumber, checkoutUrl: checkout.url });
    }
    await sendOrderConfirmation({ ...created.order, items: created.mailItems });
    return NextResponse.json({ orderNumber, message: "Order received" }, { status: 201 });
  } catch (error) {
    if (createdOrderId)
      await db.$transaction(async (tx) => {
        const order = await tx.order.findFirst({
          where: { id: createdOrderId, paymentStatus: "PENDING" },
          include: { items: true },
        });
        if (!order) return;
        await tx.order.update({
          where: { id: order.id },
          data: { paymentStatus: "FAILED", status: "CANCELLED" },
        });
        for (const item of order.items) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stockQuantity: { increment: item.quantity } },
          });
          await tx.inventoryLog.create({
            data: {
              variantId: item.variantId,
              changeQuantity: item.quantity,
              reason: `Checkout initialization failed ${order.orderNumber}`,
            },
          });
        }
        if (order.couponId)
          await tx.coupon.update({
            where: { id: order.couponId },
            data: { redemptionCount: { decrement: 1 } },
          });
      });
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not place order.",
      },
      { status: 409 },
    );
  }
}
