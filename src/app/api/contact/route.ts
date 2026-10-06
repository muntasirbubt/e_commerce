import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
const schema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().max(254),
  subject: z.string().min(3).max(120),
  message: z.string().min(10).max(4000),
});
export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      {
        error:
          "Please complete each field. Messages must be at least 10 characters.",
      },
      { status: 400 },
    );
  await db.contactMessage.create({ data: parsed.data });
  return NextResponse.json({ ok: true }, { status: 201 });
}
