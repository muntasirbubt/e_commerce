import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams;
  const page = Math.max(1, Number(search.get("page")) || 1);
  const take = Math.min(50, Math.max(1, Number(search.get("limit")) || 12));
  const query = search.get("q")?.trim();
  const where = {
    isPublished: true,
    ...(query
      ? {
          OR: [
            { title: { contains: query, mode: "insensitive" as const } },
            {
              category: {
                name: { contains: query, mode: "insensitive" as const },
              },
            },
          ],
        }
      : {}),
    ...(search.get("category")
      ? { category: { slug: search.get("category")! } }
      : {}),
  };
  const [items, total] = await Promise.all([
    db.product.findMany({
      where,
      include: { category: true, variants: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * take,
      take,
    }),
    db.product.count({ where }),
  ]);
  return NextResponse.json({
    items,
    page,
    total,
    pages: Math.ceil(total / take),
  });
}
