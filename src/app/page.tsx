import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight, Search, Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import { getStoreSettings } from "@/lib/config";
import { ProductCard } from "@/components/product-card";
import { NotifyForm } from "@/components/notify-form";
import type { Prisma } from "@prisma/client";

type CatalogProduct = Prisma.ProductGetPayload<{
  include: { variants: true; category: true; media: true; reviews: true };
}>;
const include = {
  variants: true,
  category: true,
  media: { orderBy: { position: "asc" as const } },
  reviews: true,
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
}) {
  const [params, settings] = await Promise.all([searchParams, getStoreSettings()]);
  const page = Math.max(1, Number(params.page) || 1);
  const search = params.q?.trim();
  const baseWhere = {
    isPublished: true,
    isUpcoming: false,
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            {
              category: {
                name: { contains: search, mode: "insensitive" as const },
              },
            },
          ],
        }
      : {}),
    ...(params.category ? { category: { slug: params.category } } : {}),
  };
  let products: CatalogProduct[] = [],
    offers: CatalogProduct[] = [],
    upcoming: CatalogProduct[] = [],
    categories: Awaited<ReturnType<typeof db.category.findMany>> = [],
    count = 0;
  try {
    [products, offers, upcoming, categories, count] = await Promise.all([
      db.product.findMany({
        where: baseWhere,
        include,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * 9,
        take: 9,
      }),
      db.product.findMany({
        where: {
          isPublished: true,
          isUpcoming: false,
          variants: { some: { salePrice: { not: null } } },
        },
        include,
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
      db.product.findMany({
        where: { isPublished: true, isUpcoming: true },
        include,
        orderBy: { launchAt: "asc" },
        take: 3,
      }),
      db.category.findMany({ orderBy: { name: "asc" } }),
      db.product.count({ where: baseWhere }),
    ]);
  } catch {}
  return (
    <main>
      <div className="bg-[#1b3b2b] px-4 py-2.5 text-center text-[10px] font-medium uppercase tracking-[.2em] text-white/85 sm:text-xs">
        Thoughtful design, everyday utility <span className="mx-2 text-[#a8c8a6]">·</span>{" "}
        Complimentary shipping on orders over {settings.currency} 100
      </div>
      <section className="relative overflow-hidden bg-[#e9efe7]">
        <div className="pointer-events-none absolute -right-32 -top-32 size-[40rem] rounded-full border border-[#1b3b2b]/[.07]" />
        <div className="pointer-events-none absolute -right-12 -top-12 size-[28rem] rounded-full border border-[#1b3b2b]/[.08]" />
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 md:min-h-[580px] md:grid-cols-[1.03fr_.97fr] md:py-20 lg:px-8">
          <div className="relative z-10">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#1b3b2b]/15 bg-white/50 px-4 py-2 text-[10px] font-semibold uppercase tracking-[.2em] text-[#42644c]">
              <Sparkles size={13} /> Objects for the considered life
            </div>
            <h1 className="max-w-2xl font-serif text-5xl leading-[1.02] tracking-[-.045em] text-[#1b3b2b] sm:text-6xl lg:text-[5.15rem]">
              A softer way
              <br />
              to <span className="italic text-[#709277]">live well.</span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-[#56685b]">
              Useful, lasting pieces made to bring a little more intention to the everyday.
              Thoughtfully chosen. Better by design.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="#shop"
                style={{ backgroundColor: "#1b3b2b", color: "#ffffff" }}
                className="inline-flex items-center gap-3 rounded-full px-6 py-3.5 text-sm font-semibold transition hover:bg-[#294f3b]"
              >
                Discover the collection <ArrowUpRight size={16} />
              </Link>
              <Link
                href="/about"
                className="rounded-full px-5 py-3.5 text-sm font-medium text-[#1b3b2b] transition hover:bg-white/50"
              >
                Our point of view
              </Link>
            </div>
            <div className="mt-11 flex items-center gap-4 text-xs text-[#738477]">
              <div className="flex -space-x-2">
                <span className="grid size-8 place-items-center rounded-full border-2 border-[#e9efe7] bg-[#d8e2d5] font-serif text-sm">
                  m
                </span>
                <span className="grid size-8 place-items-center rounded-full border-2 border-[#e9efe7] bg-[#c2d1c0] font-serif text-sm">
                  s
                </span>
                <span className="grid size-8 place-items-center rounded-full border-2 border-[#e9efe7] bg-[#a9bfa9] font-serif text-sm">
                  +
                </span>
              </div>
              <span>Loved by thoughtful people everywhere</span>
            </div>
          </div>
          <div className="relative mx-auto aspect-[.95] w-full max-w-[460px]">
            <div className="absolute inset-[8%] rounded-[48%_48%_42%_42%] bg-[#c9d8c6]" />
            <div className="absolute inset-[12%] overflow-hidden rounded-[48%_48%_42%_42%] bg-[radial-gradient(ellipse_at_50%_30%,#edf2e9_0%,#c4d2c0_53%,#a9bda9_100%)]">
              <div className="absolute left-[29%] top-[15%] h-[72%] w-[45%] rotate-[7deg] rounded-[38%_38%_15%_15%] border border-white/40 bg-[#f2f0e6]/70 shadow-2xl backdrop-blur-sm">
                <div className="absolute -left-3 top-[-16%] h-[30%] w-[105%] rounded-[50%] border-[9px] border-[#78917c] bg-transparent" />
                <div className="absolute inset-x-[15%] top-[38%] h-px bg-[#1b3b2b]/15" />
                <span className="absolute inset-x-0 top-[46%] text-center font-serif text-3xl italic text-[#526e57]/55">
                  m.
                </span>
              </div>
              <div className="absolute bottom-[12%] left-[14%] h-[24%] w-[30%] rounded-[47%_47%_14%_14%] bg-[#f8f9f5]/75 shadow-xl backdrop-blur-sm">
                <span className="absolute -top-[22%] left-[15%] h-[34%] w-[70%] rounded-t-full border-[7px] border-[#f8f9f5]/75 border-b-0" />
              </div>
              <div className="absolute bottom-[15%] right-[12%] size-[18%] rounded-full bg-[#76927a]/70 shadow-lg" />
            </div>
            <span className="absolute right-0 top-[15%] grid size-20 place-items-center rounded-full bg-[#f8f9f5] font-serif text-2xl italic text-[#1b3b2b] shadow-lg sm:size-24">
              made
              <br />
              <span className="text-xs not-italic">with care</span>
            </span>
            <span className="absolute bottom-[5%] left-[3%] rounded-full border border-[#1b3b2b]/15 bg-white/60 px-4 py-2 text-[10px] uppercase tracking-[.2em] text-[#405c47] backdrop-blur">
              Less, but better
            </span>
          </div>
        </div>
      </section>
      <div className="border-y border-[#1b3b2b]/10 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-0 px-5 py-3 sm:grid-cols-4 lg:px-8">
          {[
            ["01", "Considered materials"],
            ["02", "Made to last"],
            ["03", "Small-batch finds"],
            ["04", "Thoughtful delivery"],
          ].map(([n, t]) => (
            <div
              key={n}
              className="flex items-center gap-3 border-[#1b3b2b]/10 px-3 py-1.5 odd:border-r sm:justify-center sm:border-r sm:last:border-0"
            >
              <span className="font-serif text-lg italic text-[#84a98c]">{n}</span>
              <span className="text-[13px] text-[#526156]">{t}</span>
            </div>
          ))}
        </div>
      </div>
      {offers.length > 0 && (
        <section id="offers" className="mx-auto max-w-7xl scroll-mt-24 px-5 pt-20 lg:px-8">
          <div className="mb-7 flex items-end justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-[#73917a]">
                A little extra
              </p>
              <h2 className="mt-2 font-serif text-3xl text-[#1b3b2b] sm:text-4xl">
                The considered offer
              </h2>
            </div>
            <span className="rounded-full bg-[#edf3eb] px-4 py-2 text-xs text-[#55735b]">
              Limited time
            </span>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {offers.map((p) => (
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
      {upcoming.length > 0 && (
        <section id="upcoming" className="mx-auto max-w-7xl scroll-mt-24 px-5 pt-20 lg:px-8">
          <div className="mb-7">
            <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-[#73917a]">
              On the horizon
            </p>
            <h2 className="mt-2 font-serif text-3xl text-[#1b3b2b] sm:text-4xl">
              Coming into view
            </h2>
            <p className="mt-2 text-sm text-[#758278]">
              A first look at the things we can’t wait to share.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((p) => (
              <article key={p.id} className="soft-card overflow-hidden">
                <div className="relative aspect-[4/2.65] overflow-hidden bg-[#e7ede5]">
                  {p.media[0]?.url || p.imageUrl ? (
                    <img
                      src={p.media[0]?.url ?? p.imageUrl ?? ""}
                      alt={p.media[0]?.alt || p.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full place-items-center bg-[radial-gradient(ellipse_at_60%_35%,#c6d7c4,#edf1e9)] font-serif text-7xl italic text-[#52745b]/30">
                      {p.title.slice(0, 1)}
                    </div>
                  )}
                  <span className="absolute left-4 top-4 rounded-full bg-white/80 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#1b3b2b] backdrop-blur">
                    Coming soon
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="font-serif text-2xl text-[#1b3b2b]">{p.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#718075]">
                    {p.description}
                  </p>
                  <NotifyForm productId={p.id} launchAt={p.launchAt?.toISOString()} />
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
      <section id="shop" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-20 lg:px-8">
        <div className="mb-8">
          <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-[#52745b]">
            The collection
          </p>
          <h2 className="mt-2 font-serif text-3xl text-[#1b3b2b] sm:text-4xl">
            Good things, kept close.
          </h2>
        </div>
        <div className="grid items-start gap-8 lg:grid-cols-[220px_1fr]">
          <aside className="rounded-2xl border border-[#1b3b2b]/10 bg-white p-5">
            <h3 className="text-sm font-semibold text-[#263a2c]">Find your thing</h3>
            <form action="/" className="mt-4">
              <label className="text-xs font-medium text-[#56645a]">
                Product or category
                <div className="mt-2 flex items-center gap-2 rounded-xl border border-[#1b3b2b]/15 px-3 py-2">
                  <Search size={15} className="shrink-0 text-[#56645a]" />
                  <input
                    name="q"
                    defaultValue={params.q}
                    placeholder="Search the shop"
                    className="w-full bg-transparent text-sm text-[#212529] outline-none placeholder:text-[#66736a]"
                  />
                </div>
              </label>
              {params.category && <input type="hidden" name="category" value={params.category} />}
              <button className="mt-3 w-full rounded-full bg-[#1b3b2b] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#294f3b]">
                Search products
              </button>
            </form>
            <div className="mt-6 border-t border-[#1b3b2b]/10 pt-5">
              <h3 className="text-sm font-semibold text-[#263a2c]">Categories</h3>
              <nav aria-label="Product categories" className="mt-3 grid gap-1">
                <Link
                  href="/#shop"
                  className={`rounded-lg px-3 py-2.5 text-sm ${!params.category ? "bg-[#e9efe7] font-semibold text-[#1b3b2b]" : "text-[#56645a] hover:bg-[#f5f7f3]"}`}
                >
                  All products
                </Link>
                {categories.map((c) => (
                  <Link
                    key={c.id}
                    href={`/?category=${c.slug}#shop`}
                    className={`flex justify-between rounded-lg px-3 py-2.5 text-sm ${params.category === c.slug ? "bg-[#e9efe7] font-semibold text-[#1b3b2b]" : "text-[#56645a] hover:bg-[#f5f7f3]"}`}
                  >
                    <span>{c.name}</span>
                    <span aria-hidden="true">›</span>
                  </Link>
                ))}
              </nav>
            </div>
          </aside>
          <div>
            <div className="mb-5 flex items-center justify-between gap-3">
              <p className="text-sm text-[#56645a]">
                {count} {count === 1 ? "product" : "products"}
                {search ? ` matching “${search}”` : ""}
              </p>
              {(search || params.category) && (
                <Link
                  href="/#shop"
                  className="text-xs font-semibold text-[#315a3b] underline underline-offset-4"
                >
                  Clear filters
                </Link>
              )}
            </div>
            {products.length ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    currency={settings.currency}
                    threshold={settings.lowStockThreshold}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-[#1b3b2b]/20 bg-white/80 px-6 py-16 text-center">
                <p className="font-serif text-2xl text-[#1b3b2b]">No matching products</p>
                <p className="mt-2 text-sm text-[#56645a]">
                  Try a different product name or category.
                </p>
              </div>
            )}
            {count > 9 && (
              <div className="mt-9 flex justify-center gap-3">
                <Link
                  aria-disabled={page <= 1}
                  href={`/?${search ? `q=${encodeURIComponent(search)}&` : ""}${params.category ? `category=${encodeURIComponent(params.category)}&` : ""}page=${page - 1}#shop`}
                  className="rounded-full border border-[#1b3b2b]/15 px-4 py-2 text-xs text-[#34473b]"
                >
                  Previous
                </Link>
                <span className="px-3 py-2 text-xs text-[#56645a]">
                  Page {page} of {Math.ceil(count / 9)}
                </span>
                <Link
                  href={`/?${search ? `q=${encodeURIComponent(search)}&` : ""}${params.category ? `category=${encodeURIComponent(params.category)}&` : ""}page=${page + 1}#shop`}
                  className="rounded-full border border-[#1b3b2b]/15 px-4 py-2 text-xs text-[#34473b]"
                >
                  Next
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 pb-8 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] bg-[#1b3b2b] px-7 py-10 text-white sm:px-12 sm:py-14">
          <div className="absolute -right-12 -top-20 size-72 rounded-full border border-white/10" />
          <div className="absolute -right-2 -top-10 size-52 rounded-full border border-white/10" />
          <div className="relative flex flex-col justify-between gap-7 sm:flex-row sm:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-[#b0cbb0]">
                A note from us
              </p>
              <h2 className="mt-3 max-w-xl font-serif text-3xl leading-tight sm:text-4xl">
                Make a little more room
                <br />
                for what matters.
              </h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-white/80">
                Get new arrivals, thoughtful reads, and occasional good things in your inbox.
              </p>
            </div>
            <Link
              href="/contact"
              style={{ backgroundColor: "#e5eee3", color: "#163823" }}
              className="inline-flex shrink-0 items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
            >
              Stay in the loop <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
