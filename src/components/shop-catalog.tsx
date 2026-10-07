import Link from "next/link";
import { Suspense } from "react";
import { Search } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getStoreSettings } from "@/lib/config";
import { ProductCard } from "@/components/product-card";
import { PriceRangeInputs } from "@/components/price-range-inputs";
import { SortSelect } from "@/components/sort-select";

export type CatalogSearchParams = {
  q?: string;
  category?: string;
  page?: string;
  size?: string;
  color?: string;
  fit?: string;
  material?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
};

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "best-selling", label: "Best selling" },
] as const;
type SortValue = (typeof SORT_OPTIONS)[number]["value"];

const PAGE_SIZE = 9;
const include = {
  variants: true,
  category: true,
  media: { orderBy: { position: "asc" as const } },
  reviews: true,
};
type CatalogProduct = Prisma.ProductGetPayload<{
  include: { variants: true; category: true; media: true; reviews: true };
}>;

const colorSwatches: Record<string, string> = {
  black: "#202321",
  white: "#f8f8f5",
  navy: "#26364d",
  blue: "#557caa",
  red: "#ad5149",
  green: "#56745b",
  olive: "#77734a",
  beige: "#d9c7a5",
  cream: "#eee7d8",
  brown: "#795b46",
  grey: "#929795",
  gray: "#929795",
  pink: "#d9a9ae",
  purple: "#80618e",
  yellow: "#dfc867",
  orange: "#d3844f",
};

const effectivePrice = (v: { price: Prisma.Decimal; salePrice: Prisma.Decimal | null }) =>
  v.salePrice && Number(v.salePrice) < Number(v.price) ? Number(v.salePrice) : Number(v.price);

/**
 * Product listing with search, filters, sorting and pagination.
 * `basePath` is the route the filters submit to (e.g. "/shop" or "/collections/tops").
 * `lockedCategory` pins the category (collection pages) and hides it from the query string.
 */
export async function ShopCatalog({
  params,
  basePath,
  lockedCategory,
  heading,
  eyebrow,
}: {
  params: CatalogSearchParams;
  basePath: string;
  lockedCategory?: string;
  heading: string;
  eyebrow: string;
}) {
  const settings = await getStoreSettings();
  const category = lockedCategory ?? params.category;
  const sort: SortValue = SORT_OPTIONS.some((o) => o.value === params.sort)
    ? (params.sort as SortValue)
    : "newest";
  const page = Math.max(1, Number(params.page) || 1);
  const search = params.q?.trim();
  const minPrice = params.minPrice ? Number(params.minPrice) : undefined;
  const maxPrice = params.maxPrice ? Number(params.maxPrice) : undefined;

  const queryParams = new URLSearchParams();
  for (const key of ["q", "category", "size", "color", "fit", "material", "minPrice", "maxPrice", "sort"] as const) {
    if (key === "category" && lockedCategory) continue;
    const value = params[key];
    if (value) queryParams.set(key, value);
  }
  const hrefWith = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(queryParams);
    for (const [k, v] of Object.entries(changes)) v === null ? next.delete(k) : next.set(k, v);
    const qs = next.toString();
    return `${basePath}${qs ? `?${qs}` : ""}`;
  };

  const insensitive = "insensitive" as const;
  const where: Prisma.ProductWhereInput = {
    isPublished: true,
    isUpcoming: false,
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: insensitive } },
            { description: { contains: search, mode: insensitive } },
            { material: { contains: search, mode: insensitive } },
            { fitType: { contains: search, mode: insensitive } },
            { category: { name: { contains: search, mode: insensitive } } },
            { variants: { some: { color: { contains: search, mode: insensitive } } } },
          ],
        }
      : {}),
    ...(category ? { category: { slug: category } } : {}),
    ...(params.fit ? { fitType: params.fit } : {}),
    ...(params.material ? { material: params.material } : {}),
    ...(params.size || params.color || minPrice !== undefined || maxPrice !== undefined
      ? {
          variants: {
            some: {
              ...(params.size ? { size: params.size } : {}),
              ...(params.color ? { color: params.color } : {}),
              ...(minPrice !== undefined || maxPrice !== undefined
                ? {
                    price: {
                      ...(minPrice !== undefined && Number.isFinite(minPrice) ? { gte: minPrice } : {}),
                      ...(maxPrice !== undefined && Number.isFinite(maxPrice) ? { lte: maxPrice } : {}),
                    },
                  }
                : {}),
            },
          },
        }
      : {}),
  };

  let products: CatalogProduct[] = [],
    categories: Awaited<ReturnType<typeof db.category.findMany>> = [],
    variantFacets: { size: string | null; color: string | null }[] = [],
    apparelFacets: { fitType: string | null; material: string | null }[] = [],
    count = 0;
  try {
    [categories, count, variantFacets, apparelFacets] = await Promise.all([
      db.category.findMany({ orderBy: { name: "asc" } }),
      db.product.count({ where }),
      db.productVariant.findMany({
        where: { product: { isPublished: true, isUpcoming: false } },
        select: { size: true, color: true },
        distinct: ["size", "color"],
      }),
      db.product.findMany({
        where: { isPublished: true },
        select: { fitType: true, material: true },
      }),
    ]);

    if (sort === "newest") {
      products = await db.product.findMany({
        where,
        include,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      });
    } else {
      // Prisma cannot order by a relation aggregate (min variant price / units sold),
      // so rank matching product IDs in memory, then load just the current page.
      const candidates = await db.product.findMany({
        where,
        select: { id: true, createdAt: true, variants: { select: { id: true, price: true, salePrice: true } } },
      });
      let score: Map<string, number>;
      if (sort === "best-selling") {
        const sold = await db.orderItem.groupBy({
          by: ["variantId"],
          where: {
            variantId: { in: candidates.flatMap((p) => p.variants.map((v) => v.id)) },
            order: { status: { not: "CANCELLED" } },
          },
          _sum: { quantity: true },
        });
        const byVariant = new Map(sold.map((s) => [s.variantId, s._sum.quantity ?? 0]));
        score = new Map(
          candidates.map((p) => [p.id, p.variants.reduce((n, v) => n + (byVariant.get(v.id) ?? 0), 0)]),
        );
      } else {
        score = new Map(
          candidates.map((p) => [
            p.id,
            p.variants.length ? Math.min(...p.variants.map(effectivePrice)) : Number.POSITIVE_INFINITY,
          ]),
        );
      }
      const direction = sort === "price-asc" ? 1 : -1;
      const pageIds = candidates
        .sort(
          (a, b) =>
            direction * (score.get(a.id)! - score.get(b.id)!) ||
            b.createdAt.getTime() - a.createdAt.getTime(),
        )
        .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
        .map((p) => p.id);
      const loaded = await db.product.findMany({ where: { id: { in: pageIds } }, include });
      const byId = new Map(loaded.map((p) => [p.id, p]));
      products = pageIds.map((id) => byId.get(id)).filter((p): p is CatalogProduct => Boolean(p));
    }
  } catch {}

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const hasFilters = Boolean(
    search ||
      (!lockedCategory && params.category) ||
      params.size ||
      params.color ||
      params.fit ||
      params.material ||
      params.minPrice ||
      params.maxPrice,
  );
  const unique = (values: (string | null)[]) =>
    [...new Set(values.filter((x): x is string => Boolean(x)))].sort();

  return (
    <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
      <div className="mb-8">
        <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-[#52745b]">{eyebrow}</p>
        <h1 className="mt-2 font-serif text-4xl text-[#1b3b2b] sm:text-5xl">{heading}</h1>
      </div>
      <div className="grid items-start gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="rounded-2xl border border-[#1b3b2b]/10 bg-white p-5">
          <h2 className="text-sm font-semibold text-[#263a2c]">Find your thing</h2>
          <form action={basePath} className="mt-4">
            <label className="text-xs font-medium text-[#56645a]">
              Search
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-[#1b3b2b]/15 px-3 py-2">
                <Search size={15} className="shrink-0 text-[#56645a]" />
                <input
                  id="shop-search"
                  name="q"
                  defaultValue={params.q}
                  placeholder="Linen, navy, relaxed…"
                  className="w-full bg-transparent text-sm text-[#212529] outline-none placeholder:text-[#66736a]"
                />
              </div>
            </label>
            {!lockedCategory && params.category && (
              <input type="hidden" name="category" value={params.category} />
            )}
            {params.sort && <input type="hidden" name="sort" value={params.sort} />}
            <div className="mt-4 grid gap-3">
              <label className="text-xs font-medium text-[#56645a]">
                Size
                <select
                  name="size"
                  defaultValue={params.size ?? ""}
                  className="mt-1.5 block w-full rounded-xl border border-[#1b3b2b]/15 bg-white px-3 py-2.5 text-sm text-[#34473b]"
                >
                  <option value="">All sizes</option>
                  {unique(variantFacets.map((v) => v.size)).map((size) => (
                    <option key={size}>{size}</option>
                  ))}
                </select>
              </label>
              <fieldset>
                <legend className="text-xs font-medium text-[#56645a]">Color</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  <label title="All colors" className="cursor-pointer">
                    <input className="peer sr-only" type="radio" name="color" value="" defaultChecked={!params.color} />
                    <span className="block rounded-full border border-[#1b3b2b]/20 px-2.5 py-1 text-[10px] text-[#56645a] peer-checked:border-[#1b3b2b] peer-checked:bg-[#e9efe7]">
                      All
                    </span>
                  </label>
                  {unique(variantFacets.map((v) => v.color)).map((color) => (
                    <label key={color} title={color} className="cursor-pointer">
                      <input
                        className="peer sr-only"
                        type="radio"
                        name="color"
                        value={color}
                        defaultChecked={params.color === color}
                      />
                      <span className="flex items-center gap-1.5 rounded-full border border-transparent px-1.5 py-1 text-[10px] text-[#56645a] peer-checked:border-[#1b3b2b]/35">
                        <i
                          aria-hidden="true"
                          className="size-4 rounded-full border border-black/15"
                          style={{ backgroundColor: colorSwatches[color.toLowerCase()] ?? "#aeb8ad" }}
                        />
                        {color}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className="text-xs font-medium text-[#56645a]">
                Fit
                <select
                  name="fit"
                  defaultValue={params.fit ?? ""}
                  className="mt-1.5 block w-full rounded-xl border border-[#1b3b2b]/15 bg-white px-3 py-2.5 text-sm text-[#34473b]"
                >
                  <option value="">Any fit</option>
                  {unique(apparelFacets.map((v) => v.fitType)).map((fit) => (
                    <option key={fit}>{fit}</option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-medium text-[#56645a]">
                Fabric / material
                <select
                  name="material"
                  defaultValue={params.material ?? ""}
                  className="mt-1.5 block w-full rounded-xl border border-[#1b3b2b]/15 bg-white px-3 py-2.5 text-sm text-[#34473b]"
                >
                  <option value="">Any material</option>
                  {unique(apparelFacets.map((v) => v.material)).map((material) => (
                    <option key={material}>{material}</option>
                  ))}
                </select>
              </label>
              <div>
                <p className="text-xs font-medium text-[#56645a]">Price range</p>
                <PriceRangeInputs minValue={params.minPrice} maxValue={params.maxPrice} />
              </div>
            </div>
            <button className="mt-3 w-full rounded-full bg-[#1b3b2b] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#294f3b]">
              Search products
            </button>
          </form>
          <div className="mt-6 border-t border-[#1b3b2b]/10 pt-5">
            <h2 className="text-sm font-semibold text-[#263a2c]">Collections</h2>
            <nav aria-label="Product categories" className="mt-3 grid gap-1">
              <Link
                href="/shop"
                className={`rounded-lg px-3 py-2.5 text-sm ${!category ? "bg-[#e9efe7] font-semibold text-[#1b3b2b]" : "text-[#56645a] hover:bg-[#f5f7f3]"}`}
              >
                All products
              </Link>
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/collections/${c.slug}`}
                  className={`flex justify-between rounded-lg px-3 py-2.5 text-sm ${category === c.slug ? "bg-[#e9efe7] font-semibold text-[#1b3b2b]" : "text-[#56645a] hover:bg-[#f5f7f3]"}`}
                >
                  <span>{c.name}</span>
                  <span aria-hidden="true">›</span>
                </Link>
              ))}
            </nav>
          </div>
        </aside>
        <div>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[#56645a]">
              {count} {count === 1 ? "product" : "products"}
              {search ? ` matching “${search}”` : ""}
              {hasFilters && (
                <Link
                  href={basePath}
                  className="ml-3 text-xs font-semibold text-[#315a3b] underline underline-offset-4"
                >
                  Clear filters
                </Link>
              )}
            </p>
            <Suspense>
              <SortSelect value={sort} options={SORT_OPTIONS.map((o) => ({ ...o }))} />
            </Suspense>
          </div>
          {products.length ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} currency={settings.currency} threshold={settings.lowStockThreshold} />
              ))}
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-[#1b3b2b]/20 bg-white/80 px-6 py-16 text-center">
              <p className="font-serif text-2xl text-[#1b3b2b]">No matching products</p>
              <p className="mt-2 text-sm text-[#56645a]">Try a different word, color, or material.</p>
            </div>
          )}
          {count > PAGE_SIZE && (
            <nav aria-label="Pagination" className="mt-9 flex justify-center gap-3">
              {page > 1 ? (
                <Link
                  href={hrefWith({ page: String(page - 1) })}
                  className="rounded-full border border-[#1b3b2b]/15 px-4 py-2 text-xs text-[#34473b] hover:bg-white"
                >
                  Previous
                </Link>
              ) : (
                <span className="rounded-full border border-[#1b3b2b]/10 px-4 py-2 text-xs text-[#34473b]/40">Previous</span>
              )}
              <span className="px-3 py-2 text-xs text-[#56645a]">
                Page {page} of {totalPages}
              </span>
              {page < totalPages ? (
                <Link
                  href={hrefWith({ page: String(page + 1) })}
                  className="rounded-full border border-[#1b3b2b]/15 px-4 py-2 text-xs text-[#34473b] hover:bg-white"
                >
                  Next
                </Link>
              ) : (
                <span className="rounded-full border border-[#1b3b2b]/10 px-4 py-2 text-xs text-[#34473b]/40">Next</span>
              )}
            </nav>
          )}
        </div>
      </div>
    </section>
  );
}
