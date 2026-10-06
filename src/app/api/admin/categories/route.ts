import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
export async function POST(request: NextRequest) {
  if (!(await requireAdmin()))
    return NextResponse.json(
      { error: "Admin access required." },
      { status: 401 },
    );
  const p = z
    .object({
      name: z.string().min(2).max(80),
      slug: z
        .string()
        .min(2)
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    })
    .safeParse(await request.json().catch(() => null));
  if (!p.success)
    return NextResponse.json(
      { error: "Enter a category name and valid URL slug." },
      { status: 400 },
    );
  try {
    return NextResponse.json(await db.category.create({ data: p.data }), {
      status: 201,
    });
  } catch {
    return NextResponse.json(
      { error: "That category name or slug may already exist." },
      { status: 409 },
    );
  }
}
