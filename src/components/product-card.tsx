import Link from "next/link";
import { ArrowUpRight, Star } from "lucide-react";
import type { Prisma } from "@prisma/client";

type ProductCardData = Prisma.ProductGetPayload<{
  include: { variants: true; category: true; media: true; reviews?: true };
}>;
export function ProductCard({
  product,
  currency = "USD",
  threshold = 5,
}: {
  product: ProductCardData;
  currency?: string;
  threshold?: number;
}) {
  const stock = product.variants.reduce(
    (total, variant) => total + variant.stockQuantity,
    0,
  );
  const salePrice = product.variants.reduce<number | null>((best, variant) => {
    const current =
      variant.salePrice && Number(variant.salePrice) < Number(variant.price)
        ? Number(variant.salePrice)
        : null;
    return current !== null && (best === null || current < best)
      ? current
      : best;
  }, null);
  const comparePrice = product.variants.length
    ? Math.min(...product.variants.map((v) => Number(v.price)))
    : 0;
  const rating = product.reviews?.length
    ? product.reviews.reduce((sum, review) => sum + review.rating, 0) /
      product.reviews.length
    : 0;
  const photo = product.media[0]?.url ?? product.imageUrl;
  return (
    <article className="soft-card group overflow-hidden">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-[4/4.3] overflow-hidden bg-[#e9efe8]">
          {photo ? (
            <img
              src={photo}
              alt={product.media[0]?.alt || product.title}
              className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="grid h-full place-items-center bg-[radial-gradient(ellipse_at_65%_35%,#c8d9c8_0%,#eaf0e8_48%,#f4f5f1_100%)]">
              <span className="font-serif text-7xl text-[#52745b]/35">
                {product.title.slice(0, 1)}
              </span>
            </div>
          )}
          {salePrice !== null && salePrice < comparePrice && (
            <span className="absolute left-4 top-4 rounded-full bg-[#1b3b2b] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.14em] text-white">
              Save {Math.round((1 - salePrice / comparePrice) * 100)}%
            </span>
          )}
          {stock > 0 && stock <= threshold && (
            <span className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#1b3b2b]">
              Only {stock} left
            </span>
          )}
          <span className="absolute bottom-4 right-4 grid size-10 translate-y-2 place-items-center rounded-full bg-white text-[#1b3b2b] opacity-0 shadow-lg transition group-hover:translate-y-0 group-hover:opacity-100">
            <ArrowUpRight size={17} />
          </span>
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#73917a]">
                {product.category?.name ?? "The collection"}
              </p>
              <h3 className="mt-1.5 font-medium tracking-tight text-[#24362a]">
                {product.title}
              </h3>
            </div>
            <div className="text-right text-sm font-medium text-[#1b3b2b]">
              {salePrice !== null ? (
                <>
                  <span>
                    {currency} {salePrice.toFixed(2)}
                  </span>
                  <span className="ml-2 text-xs text-[#8a948b] line-through">
                    {comparePrice.toFixed(2)}
                  </span>
                </>
              ) : (
                <span>
                  {currency} {comparePrice.toFixed(2)}
                </span>
              )}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-[#7a887d]">
            <span>
              {stock
                ? stock <= threshold
                  ? "Limited stock"
                  : "Ready to ship"
                : "Out of stock"}
            </span>
            {rating > 0 && (
              <span className="inline-flex items-center gap-1">
                <Star size={12} className="fill-[#73917a] text-[#73917a]" />
                {rating.toFixed(1)} ({product.reviews!.length})
              </span>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}
