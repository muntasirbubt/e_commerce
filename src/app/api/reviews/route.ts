import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
const schema = z.object({
  productId: z.string(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(100).optional(),
  body: z.string().min(10).max(2000),
});
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json(
      { error: "Sign in to leave a review." },
      { status: 401 },
    );
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Please check your review; it must be at least 10 characters." },
      { status: 400 },
    );
  try {
    const review = await db.productReview.create({
      data: { ...parsed.data, userId: session.user.id },
    });
    return NextResponse.json(review, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "You may already have reviewed this product." },
      { status: 409 },
    );
  }
}
