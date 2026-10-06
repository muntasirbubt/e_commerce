import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
export async function GET() {
  if (!(await requireAdmin()))
    return NextResponse.json(
      { error: "Admin access required." },
      { status: 401 },
    );
  return NextResponse.json(
    await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  );
}
