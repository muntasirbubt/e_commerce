import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
const schema = z.object({
  email: z.string().email().max(254),
  productId: z.string().min(1),
});
export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Enter a valid email address." },
      { status: 400 },
    );
  const product = await db.product.findFirst({
    where: { id: parsed.data.productId, isUpcoming: true, isPublished: true },
    select: { id: true },
  });
  if (!product)
    return NextResponse.json(
      { error: "This preview is no longer available." },
      { status: 404 },
    );
  try {
    await db.notifySubscription.upsert({
      where: {
        email_productId: {
          email: parsed.data.email.toLowerCase(),
          productId: product.id,
        },
      },
      create: { email: parsed.data.email.toLowerCase(), productId: product.id },
      update: {},
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Could not save your reminder. Try again." },
      { status: 500 },
    );
  }
}
