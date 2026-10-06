import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
const schema = z
  .object({
    code: z
      .string()
      .min(3)
      .max(40)
      .regex(/^[A-Za-z0-9_-]+$/),
    discountType: z.enum(["PERCENTAGE", "FIXED"]),
    amount: z.number().positive(),
    startsAt: z.string().datetime().nullable().optional(),
    endsAt: z.string().datetime().nullable().optional(),
    maxRedemptions: z.number().int().positive().nullable().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.discountType === "PERCENTAGE" && v.amount > 100)
      ctx.addIssue({
        code: "custom",
        message: "Percent discount cannot exceed 100%.",
        path: ["amount"],
      });
    if (v.startsAt && v.endsAt && new Date(v.endsAt) < new Date(v.startsAt))
      ctx.addIssue({
        code: "custom",
        message: "End date must follow start date.",
        path: ["endsAt"],
      });
  });
export async function GET() {
  if (!(await requireAdmin()))
    return NextResponse.json(
      { error: "Admin access required." },
      { status: 401 },
    );
  return NextResponse.json(
    await db.coupon.findMany({ orderBy: { createdAt: "desc" } }),
  );
}
export async function POST(request: NextRequest) {
  if (!(await requireAdmin()))
    return NextResponse.json(
      { error: "Admin access required." },
      { status: 401 },
    );
  const p = schema.safeParse(await request.json().catch(() => null));
  if (!p.success)
    return NextResponse.json(
      { error: p.error.issues[0]?.message ?? "Invalid coupon." },
      { status: 400 },
    );
  const d = p.data;
  try {
    const coupon = await db.coupon.create({
      data: {
        code: d.code.toUpperCase(),
        discountType: d.discountType,
        amount: d.amount,
        startsAt: d.startsAt ? new Date(d.startsAt) : null,
        endsAt: d.endsAt ? new Date(d.endsAt) : null,
        maxRedemptions: d.maxRedemptions ?? null,
      },
    });
    return NextResponse.json(coupon, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "That code already exists." },
      { status: 409 },
    );
  }
}
