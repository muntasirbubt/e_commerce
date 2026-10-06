import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
const schema = z.object({
  gatewayEnabled: z.boolean(),
  activePaymentProviders: z.array(
    z.enum(["cod", "bank_transfer", "order_request", "stripe", "paypal"]),
  ),
  shippingFee: z.number().min(0),
  lowStockThreshold: z.number().int().min(0),
  storeName: z.string().min(1).max(80),
  currency: z.string().length(3),
  supportEmail: z.string().email().or(z.literal("")),
  supportPhone: z.string().max(40),
  storeAddress: z.string().max(250),
});
export async function PUT(request: NextRequest) {
  if (!(await requireAdmin()))
    return NextResponse.json(
      { error: "Admin access required." },
      { status: 401 },
    );
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid settings." }, { status: 400 });
  return NextResponse.json(
    await db.storeSettings.upsert({
      where: { id: 1 },
      create: { id: 1, ...parsed.data },
      update: parsed.data,
    }),
  );
}
