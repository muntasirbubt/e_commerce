import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { HomepageCurationManager } from "@/components/homepage-curation-manager";

export default async function HomepageCurationPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/signin?callbackUrl=/admin/homepage");
  if (session.user.role !== "ADMIN") redirect("/");

  const products = await db.product.findMany({
    include: {
      variants: { select: { price: true, salePrice: true } },
      media: { orderBy: { position: "asc" }, take: 1, select: { url: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
      <Link href="/admin" className="text-xs text-[#56645a]">
        ← Back to dashboard
      </Link>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#52745b]">
            Storefront merchandising
          </p>
          <h1 className="mt-1 font-serif text-4xl text-[#1b3b2b]">Homepage blocks</h1>
          <p className="mt-2 text-sm text-[#657367]">
            Choose which products appear in Offers and Coming Soon.
          </p>
        </div>
        <Link
          href="/admin/catalog"
          className="rounded-full bg-[#1b3b2b] px-4 py-2.5 text-xs font-semibold text-white"
        >
          Create or edit products
        </Link>
      </div>
      <HomepageCurationManager
        initial={products.map((product) => ({
          id: product.id,
          title: product.title,
          imageUrl: product.media[0]?.url ?? product.imageUrl,
          isPublished: product.isPublished,
          isUpcoming: product.isUpcoming,
          featuredOffer: product.featuredOffer,
          featuredUpcoming: product.featuredUpcoming,
          hasSalePrice: product.variants.some(
            (variant) =>
              variant.salePrice !== null && Number(variant.salePrice) < Number(variant.price),
          ),
        }))}
      />
    </main>
  );
}
