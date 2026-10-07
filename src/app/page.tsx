import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ArrowUpRight, Sparkles } from "lucide-react";
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
const catalogKeys = ["q", "category", "page", "size", "color", "fit", "material", "minPrice", "maxPrice", "sort"] as const;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Partial<Record<(typeof catalogKeys)[number], string>>>;
}) {
  const [params, settings] = await Promise.all([searchParams, getStoreSettings()]);
  // The catalog used to live on the homepage; keep old shared links working.
  const legacy = new URLSearchParams();
  for (const key of catalogKeys) if (params[key]) legacy.set(key, params[key]!);
  if (legacy.size) {
    const category = legacy.get("category");
    legacy.delete("category");
    const qs = legacy.toString();
    redirect(`${category ? `/collections/${encodeURIComponent(category)}` : "/shop"}${qs ? `?${qs}` : ""}`);
  }
  let newArrivals: CatalogProduct[] = [],
    offers: CatalogProduct[] = [],
    upcoming: CatalogProduct[] = [];
  try {
    [newArrivals, offers, upcoming] = await Promise.all([
      db.product.findMany({
        where: { isPublished: true, isUpcoming: false },
        include,
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      db.product.findMany({
        where: {
          isPublished: true,
          isUpcoming: false,
          featuredOffer: true,
          variants: { some: { salePrice: { not: null } } },
        },
        include,
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
      db.product.findMany({
        where: { isPublished: true, isUpcoming: true, featuredUpcoming: true },
        include,
        orderBy: { launchAt: "asc" },
        take: 3,
      }),
    ]);
  } catch {}
  return (
    <main>
      <div className="bg-[#1b3b2b] px-4 py-2.5 text-center text-[10px] font-medium uppercase tracking-[.2em] text-white/85 sm:text-xs">
        Thoughtful design, everyday utility
        {settings.freeShippingThreshold !== null && settings.shippingFee > 0 && (
          <>
            <span className="mx-2 text-[#a8c8a6]">·</span>
            Complimentary shipping on orders over {settings.currency} {settings.freeShippingThreshold}
          </>
        )}
        {settings.shippingFee === 0 && (
          <>
            <span className="mx-2 text-[#a8c8a6]">·</span>
            Complimentary shipping on every order
          </>
        )}
      </div>
      <section className="relative overflow-hidden bg-[#e9efe7]">
        <div className="pointer-events-none absolute -right-32 -top-32 size-[40rem] rounded-full border border-[#1b3b2b]/[.07]" />
        <div className="pointer-events-none absolute -right-12 -top-12 size-[28rem] rounded-full border border-[#1b3b2b]/[.08]" />
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 md:min-h-[580px] md:grid-cols-[1.03fr_.97fr] md:py-20 lg:px-8">
          <div className="relative z-10">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#1b3b2b]/15 bg-white/50 px-4 py-2 text-[10px] font-semibold uppercase tracking-[.2em] text-[#42644c]">
              <Sparkles size={13} /> Clothing for considered living
            </div>
            <h1 className="max-w-2xl font-serif text-5xl leading-[1.02] tracking-[-.045em] text-[#1b3b2b] sm:text-6xl lg:text-[5.15rem]">
              A better way
              <br />
              to <span className="italic text-[#709277]">wear well.</span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-[#56685b]">
              Everyday layers, standout essentials, and well-made accessories. Designed to move with
              you and made to keep.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/shop"
                style={{ backgroundColor: "#1b3b2b", color: "#ffffff" }}
                className="inline-flex items-center gap-3 rounded-full px-6 py-3.5 text-sm font-semibold transition hover:bg-[#294f3b]"
              >
                Shop the collection <ArrowUpRight size={16} />
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
              <span>Your next everyday favourite</span>
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
            ["01", "Considered fabrics"],
            ["02", "Made to move"],
            ["03", "Small-batch drops"],
            ["04", "Easy everyday wear"],
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
        {offers.length ? (
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
        ) : (
          <div className="rounded-2xl border border-dashed border-[#1b3b2b]/20 bg-white px-6 py-10 text-center">
            <p className="font-serif text-2xl text-[#1b3b2b]">Fresh offers are on the way</p>
            <p className="mt-2 text-sm text-[#657367]">
              Check back soon for selected pieces at special prices.
            </p>
          </div>
        )}
      </section>
      <section id="upcoming" className="mx-auto max-w-7xl scroll-mt-24 px-5 pt-20 lg:px-8">
        <div className="mb-7">
          <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-[#73917a]">
            On the horizon
          </p>
          <h2 className="mt-2 font-serif text-3xl text-[#1b3b2b] sm:text-4xl">Coming into view</h2>
          <p className="mt-2 text-sm text-[#758278]">
            A first look at the things we can’t wait to share.
          </p>
        </div>
        {upcoming.length ? (
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
        ) : (
          <div className="rounded-2xl border border-dashed border-[#1b3b2b]/20 bg-white px-6 py-10 text-center">
            <p className="font-serif text-2xl text-[#1b3b2b]">A new drop is being prepared</p>
            <p className="mt-2 text-sm text-[#657367]">
              Our next release will appear here as soon as it is announced.
            </p>
          </div>
        )}
      </section>
      <section aria-label="Seasonal campaign" className="mx-auto max-w-7xl px-5 pt-16 lg:px-8">
        <div className="relative overflow-hidden rounded-[1.7rem] bg-[#dce8dc] px-7 py-8 sm:flex sm:items-center sm:justify-between sm:px-10">
          <div className="pointer-events-none absolute -right-8 -top-20 size-64 rounded-full border border-[#1b3b2b]/10" />
          <div className="relative">
            <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-[#52745b]">
              The everyday edit
            </p>
            <h2 className="mt-2 font-serif text-2xl text-[#1b3b2b] sm:text-3xl">
              Wear it on repeat.
            </h2>
            <p className="mt-2 max-w-lg text-sm leading-6 text-[#56685b]">
              Discover considered layers, easy fits, and accessories made to go further.
            </p>
          </div>
          <Link
            href="/shop"
            style={{ backgroundColor: "#1b3b2b", color: "#ffffff" }}
            className="relative mt-5 inline-flex rounded-full bg-[#1b3b2b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#294f3b] sm:mt-0"
          >
            Explore the edit <ArrowRight size={15} className="ml-2" />
          </Link>
        </div>
      </section>
      <section id="shop" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-20 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-[#52745b]">
              Just landed
            </p>
            <h2 className="mt-2 font-serif text-3xl text-[#1b3b2b] sm:text-4xl">New arrivals</h2>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 rounded-full border border-[#1b3b2b]/15 px-5 py-2.5 text-sm font-semibold text-[#1b3b2b] transition hover:bg-white"
          >
            Shop all <ArrowRight size={15} />
          </Link>
        </div>
        {newArrivals.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {newArrivals.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                currency={settings.currency}
                threshold={settings.lowStockThreshold}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#1b3b2b]/20 bg-white px-6 py-10 text-center">
            <p className="font-serif text-2xl text-[#1b3b2b]">New pieces are on the way</p>
          </div>
        )}
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
