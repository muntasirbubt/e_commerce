import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Leaf,
  ShieldCheck,
  Star,
  Truck,
} from "lucide-react";
import { db } from "@/lib/db";
import { getStoreSettings } from "@/lib/config";
import { AddToCart } from "@/components/add-to-cart";
import { ProductGallery } from "@/components/product-gallery";
import { ProductCard } from "@/components/product-card";
import { ReviewForm } from "@/components/review-form";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
type Params = { params: Promise<{ slug: string }> };
const include = {
  variants: true,
  category: true,
  media: { orderBy: { position: "asc" as const } },
  reviews: {
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" as const },
  },
};
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const p = await db.product
    .findUnique({
      where: { slug, isPublished: true },
      select: {
        title: true,
        seoTitle: true,
        seoDescription: true,
        description: true,
        media: { orderBy: { position: "asc" }, take: 1 },
      },
    })
    .catch(() => null);
  return p
    ? {
        title: p.seoTitle || p.title,
        description: p.seoDescription || p.description,
        openGraph: {
          title: p.seoTitle || p.title,
          description: p.seoDescription || p.description,
          images: p.media.map((m) => m.url),
        },
      }
    : { title: "Product not found" };
}
export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const [product, settings, session] = await Promise.all([
    db.product
      .findUnique({
        where: { slug, isPublished: true, isUpcoming: false },
        include,
      })
      .catch(() => null),
    getStoreSettings(),
    getServerSession(authOptions),
  ]);
  if (!product) notFound();
  const stock = product.variants.reduce((n, v) => n + v.stockQuantity, 0);
  const activePrices = product.variants.map((v) =>
    v.salePrice && v.salePrice.lessThan(v.price)
      ? Number(v.salePrice)
      : Number(v.price),
  );
  const fromPrice = activePrices.length ? Math.min(...activePrices) : 0;
  const average = product.reviews.length
    ? product.reviews.reduce((n, r) => n + r.rating, 0) / product.reviews.length
    : 0;
  const ratingCounts = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: product.reviews.filter((r) => r.rating === stars).length,
  }));
  const specifications =
    product.specifications &&
    typeof product.specifications === "object" &&
    !Array.isArray(product.specifications)
      ? (product.specifications as Record<string, string>)
      : {};
  const related = await db.product
    .findMany({
      where: {
        isPublished: true,
        isUpcoming: false,
        id: { not: product.id },
        ...(product.categoryId ? { categoryId: product.categoryId } : {}),
      },
      include: { variants: true, category: true, media: true, reviews: true },
      take: 3,
      orderBy: { createdAt: "desc" },
    })
    .catch(() => []);
  return (
    <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
      <div className="mb-6 flex items-center gap-2 text-xs text-[#79877c]">
        <Link
          href="/"
          className="inline-flex items-center gap-2 hover:text-[#1b3b2b]"
        >
          <ArrowLeft size={13} /> Shop
        </Link>
        <span>/</span>
        <span>{product.category?.name ?? "Collection"}</span>
      </div>
      <section className="grid gap-9 lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
        <ProductGallery
          images={product.media.map((m) => ({
            id: m.id,
            url: m.url,
            alt: m.alt,
          }))}
          fallbackAlt={product.title}
        />
        <div className="pt-2 lg:pt-8">
          <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-[#73917a]">
            {product.category?.name ?? "The collection"}
          </p>
          <h1 className="mt-3 font-serif text-4xl leading-tight text-[#1b3b2b] sm:text-5xl">
            {product.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {product.reviews.length > 0 ? (
              <a
                href="#reviews"
                className="inline-flex items-center gap-2 text-xs text-[#5f705f]"
              >
                <span className="inline-flex items-center gap-1 text-[#809b80]">
                  <Star size={14} className="fill-current" />
                  {average.toFixed(1)}
                </span>
                {product.reviews.length} thoughtful review
                {product.reviews.length === 1 ? "" : "s"}
              </a>
            ) : (
              <span className="text-xs text-[#89958b]">
                New to the collection
              </span>
            )}
            <span className="text-[#c2c9c2]">·</span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#89958b]">
              {product.variants[0]?.sku}
            </span>
          </div>
          <p className="mt-6 flex items-baseline gap-3 text-2xl font-medium text-[#1b3b2b]">
            From {settings.currency} {fromPrice.toFixed(2)}
          </p>
          <div className="my-6 h-px bg-[#1b3b2b]/10" />
          <p className="max-w-xl text-sm leading-7 text-[#657468]">
            {product.description}
          </p>
          <div className="mt-6 flex items-center gap-2 text-xs">
            {stock === 0 ? (
              <span className="rounded-full bg-red-50 px-3 py-1.5 text-red-700">
                Out of stock
              </span>
            ) : stock <= settings.lowStockThreshold ? (
              <span className="rounded-full bg-amber-50 px-3 py-1.5 text-amber-800">
                Only {stock} left in this collection
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eef4ed] px-3 py-1.5 text-[#486b50]">
                <Check size={12} /> In stock · ready to ship
              </span>
            )}
          </div>
          <AddToCart
            currency={settings.currency}
            variants={product.variants.map((v) => ({
              id: v.id,
              sku: v.sku,
              price: Number(v.price),
              salePrice: v.salePrice ? Number(v.salePrice) : null,
              stockQuantity: v.stockQuantity,
              attributes: v.attributesJson as Record<string, string>,
            }))}
          />
          <div className="mt-7 grid gap-3 border-t border-[#1b3b2b]/10 pt-5 text-xs text-[#758278] sm:grid-cols-2">
            <p className="flex items-center gap-2">
              <Truck size={15} className="text-[#78947d]" /> Thoughtful
              delivery, tracked to your door
            </p>
            <p className="flex items-center gap-2">
              <ShieldCheck size={15} className="text-[#78947d]" /> Secure
              checkout, simple returns
            </p>
            <p className="flex items-center gap-2">
              <Leaf size={15} className="text-[#78947d]" /> Considered materials
              and lasting design
            </p>
          </div>
        </div>
      </section>
      <section className="mt-16 grid gap-9 border-t border-[#1b3b2b]/10 pt-12 md:grid-cols-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#73917a]">
            The details
          </p>
          <h2 className="mt-2 font-serif text-2xl text-[#1b3b2b]">
            Made with intention.
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-7 text-[#718075]">
            {product.description}
          </p>
          {Object.keys(specifications).length > 0 && (
            <dl className="mt-6 divide-y divide-[#1b3b2b]/10">
              {Object.entries(specifications).map(([k, v]) => (
                <div
                  key={k}
                  className="flex justify-between gap-5 py-3 text-xs"
                >
                  <dt className="text-[#79877c]">{k}</dt>
                  <dd className="text-right font-medium text-[#314536]">{v}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#73917a]">
            A closer look
          </p>
          <h2 className="mt-2 font-serif text-2xl text-[#1b3b2b]">
            A few good reasons.
          </h2>
          <div className="mt-5 grid gap-3">
            {[
              [
                "01",
                "Designed to be used",
                "Practical details, quietly considered.",
              ],
              [
                "02",
                "Materials with a point of view",
                "Selected for feel, function, and longevity.",
              ],
              [
                "03",
                "A little less, a lot better",
                "Made to become part of your everyday.",
              ],
            ].map(([n, t, d]) => (
              <article
                key={n}
                className="flex gap-4 rounded-2xl bg-[#eef3ec] p-4"
              >
                <span className="font-serif italic text-[#84a98c]">{n}</span>
                <div>
                  <h3 className="text-xs font-semibold text-[#314536]">{t}</h3>
                  <p className="mt-1 text-xs text-[#7a887d]">{d}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section
        id="reviews"
        className="mt-16 scroll-mt-28 border-t border-[#1b3b2b]/10 pt-12"
      >
        <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#73917a]">
              Notes from owners
            </p>
            <h2 className="mt-2 font-serif text-3xl text-[#1b3b2b]">
              Worth sharing.
            </h2>
          </div>
          {product.reviews.length > 0 && (
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="font-serif text-4xl text-[#1b3b2b]">
                  {average.toFixed(1)}
                </p>
                <div className="mt-1 flex text-[#84a98c]">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      size={12}
                      className={n <= Math.round(average) ? "fill-current" : ""}
                    />
                  ))}
                </div>
                <p className="mt-1 text-[10px] text-[#879289]">
                  {product.reviews.length} reviews
                </p>
              </div>
              <div className="w-36 space-y-1.5">
                {ratingCounts.map((row) => (
                  <div
                    key={row.stars}
                    className="flex items-center gap-2 text-[10px] text-[#879289]"
                  >
                    <span>{row.stars}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#e9eee8]">
                      <div
                        className="h-full rounded-full bg-[#84a98c]"
                        style={{
                          width: `${product.reviews.length ? (row.count / product.reviews.length) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span>{row.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
          {product.reviews.length > 0 ? (
            <div className="space-y-4">
              {product.reviews.map((review) => (
                <article
                  key={review.id}
                  className="rounded-2xl border border-[#1b3b2b]/10 bg-white p-5"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex text-[#84a98c]">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          size={12}
                          className={n <= review.rating ? "fill-current" : ""}
                        />
                      ))}
                    </span>
                    <time className="text-[10px] text-[#929c94]">
                      {review.createdAt.toLocaleDateString()}
                    </time>
                  </div>
                  {review.title && (
                    <h3 className="mt-3 text-sm font-semibold text-[#314536]">
                      {review.title}
                    </h3>
                  )}
                  <p className="mt-2 text-sm leading-6 text-[#69776c]">
                    {review.body}
                  </p>
                  <p className="mt-4 text-[10px] font-semibold uppercase tracking-wider text-[#8a968b]">
                    {review.user.name || "A customer"}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-[#eef3ec] p-6 text-sm leading-6 text-[#758278]">
              No reviews yet. If this piece found its way into your everyday,
              share what you think.
            </div>
          )}
          {session ? (
            <ReviewForm productId={product.id} />
          ) : (
            <div className="rounded-2xl border border-dashed border-[#1b3b2b]/20 p-6">
              <p className="font-serif text-xl text-[#1b3b2b]">
                Have one at home?
              </p>
              <p className="mt-2 text-sm text-[#77857a]">
                Sign in to add a review and help someone choose well.
              </p>
              <Link
                href="/signin"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#1b3b2b] px-5 py-3 text-xs font-medium text-white"
              >
                Sign in to review <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>
      </section>
      {related.length > 0 && (
        <section className="mt-16 border-t border-[#1b3b2b]/10 pt-12">
          <div className="mb-7 flex items-end justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#73917a]">
                In good company
              </p>
              <h2 className="mt-2 font-serif text-3xl text-[#1b3b2b]">
                You may also like.
              </h2>
            </div>
            <Link
              href="/#shop"
              className="inline-flex items-center gap-2 text-xs text-[#4d6c53]"
            >
              Explore all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                currency={settings.currency}
                threshold={settings.lowStockThreshold}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
