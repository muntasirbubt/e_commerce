import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
const schema = z.object({
  code: z.string().min(2).max(40),
  subtotal: z.number().min(0),
});
export async function POST(request: NextRequest) {
  const p = schema.safeParse(await request.json().catch(() => null));
  if (!p.success)
    return NextResponse.json(
      { error: "Enter a promo code and cart subtotal." },
      { status: 400 },
    );
  const coupon = await db.coupon.findUnique({
    where: { code: p.data.code.trim().toUpperCase() },
  });
  const now = new Date();
  if (
    !coupon ||
    !coupon.active ||
    (coupon.startsAt && coupon.startsAt > now) ||
    (coupon.endsAt && coupon.endsAt < now) ||
    (coupon.maxRedemptions !== null &&
      coupon.redemptionCount >= coupon.maxRedemptions)
  )
    return NextResponse.json(
      { error: "That code is invalid or no longer active." },
      { status: 404 },
    );
  const discount = Math.min(
    p.data.subtotal,
    coupon.discountType === "PERCENTAGE"
      ? (p.data.subtotal * Number(coupon.amount)) / 100
      : Number(coupon.amount),
  );
  if (discount <= 0)
    return NextResponse.json(
      { error: "This order does not qualify for that code." },
      { status: 400 },
    );
  return NextResponse.json({
    code: coupon.code,
    discountAmount: Math.round(discount * 100) / 100,
    discountType: coupon.discountType,
    amount: Number(coupon.amount),
  });
}
