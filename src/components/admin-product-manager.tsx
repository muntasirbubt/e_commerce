"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  Check,
  LoaderCircle,
  Plus,
  Save,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import type { Prisma } from "@prisma/client";
type ProductData = Prisma.ProductGetPayload<{
  include: {
    variants: true;
    category: true;
    media: { orderBy: { position: "asc" } };
  };
}>;
type CategoryData = { id: string; name: string };
type VariantDraft = {
  id?: string;
  sku: string;
  price: string;
  salePrice: string;
  stockQuantity: string;
  size: string;
  color: string;
  other: string;
};
type MediaDraft = { url: string; alt: string; name: string };
const blankVariant = (): VariantDraft => ({
  sku: "",
  price: "",
  salePrice: "",
  stockQuantity: "0",
  size: "",
  color: "",
  other: "",
});
const attrs = (v: VariantDraft) =>
  Object.fromEntries(
    [
      ["Size", v.size],
      ["Color", v.color],
      ...v.other.split("\n").map((x) => {
        const i = x.indexOf(":");
        return i > 0 ? [x.slice(0, i).trim(), x.slice(i + 1).trim()] : ["", ""];
      }),
    ].filter(([k, val]) => String(k) && String(val)),
  );
export function AdminProductManager({
  products,
  categories,
}: {
  products: ProductData[];
  categories: CategoryData[];
}) {
  const router = useRouter();
  const [categoryOptions, setCategoryOptions] = useState(categories);
  const [catalogQuery, setCatalogQuery] = useState("");
  const [catalogCategory, setCatalogCategory] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [fitType, setFitType] = useState("");
  const [material, setMaterial] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [published, setPublished] = useState(false);
  const [upcoming, setUpcoming] = useState(false);
  const [featuredOffer, setFeaturedOffer] = useState(false);
  const [featuredUpcoming, setFeaturedUpcoming] = useState(false);
  const [launchAt, setLaunchAt] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [specs, setSpecs] = useState("{}");
  const [variants, setVariants] = useState<VariantDraft[]>([blankVariant()]);
  const [media, setMedia] = useState<MediaDraft[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [dragging, setDragging] = useState(false);
  const existing = useMemo(() => products.find((p) => p.id === editing), [products, editing]);
  const visibleProducts = useMemo(
    () =>
      products.filter((p) => {
        const q = catalogQuery.trim().toLocaleLowerCase();
        const matchesQuery =
          !q ||
          p.title.toLocaleLowerCase().includes(q) ||
          p.slug.toLocaleLowerCase().includes(q) ||
          p.category?.name.toLocaleLowerCase().includes(q) ||
          p.variants.some((v) => v.sku.toLocaleLowerCase().includes(q));
        return matchesQuery && (!catalogCategory || p.categoryId === catalogCategory);
      }),
    [products, catalogQuery, catalogCategory],
  );
  function reset() {
    setEditing(null);
    setTitle("");
    setSlug("");
    setDescription("");
    setFitType("");
    setMaterial("");
    setCategoryId("");
    setPublished(false);
    setUpcoming(false);
    setFeaturedOffer(false);
    setFeaturedUpcoming(false);
    setLaunchAt("");
    setSeoTitle("");
    setSeoDescription("");
    setSpecs("{}");
    setVariants([blankVariant()]);
    setMedia([]);
    setErrors([]);
  }
  async function addCategory() {
    const name = window.prompt("New category name");
    if (!name) return;
    const categorySlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const response = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, slug: categorySlug }),
    });
    const result = await response.json();
    if (!response.ok) {
      setErrors([result.error ?? "Could not add category."]);
      return;
    }
    setCategoryOptions([...categoryOptions, result]);
    setCategoryId(result.id);
    setMessage("Category added.");
  }
  function choose(p: ProductData) {
    setEditing(p.id);
    setTitle(p.title);
    setSlug(p.slug);
    setDescription(p.description);
    setFitType(p.fitType ?? "");
    setMaterial(p.material ?? "");
    setCategoryId(p.categoryId ?? "");
    setPublished(p.isPublished);
    setUpcoming(p.isUpcoming);
    setFeaturedOffer(p.featuredOffer);
    setFeaturedUpcoming(p.featuredUpcoming);
    setLaunchAt(p.launchAt ? new Date(p.launchAt).toISOString().slice(0, 16) : "");
    setSeoTitle(p.seoTitle ?? "");
    setSeoDescription(p.seoDescription ?? "");
    setSpecs(JSON.stringify(p.specifications, null, 2));
    setMedia(
      p.media.map((m) => ({
        url: m.url,
        alt: m.alt,
        name: m.url.split("/").pop() ?? "Product image",
      })),
    );
    setVariants(
      p.variants.map((v) => {
        const a = v.attributesJson as Record<string, string>;
        return {
          id: v.id,
          sku: v.sku,
          price: String(v.price),
          salePrice: v.salePrice ? String(v.salePrice) : "",
          stockQuantity: String(v.stockQuantity),
          size: a.Size ?? "",
          color: a.Color ?? "",
          other: Object.entries(a)
            .filter(([k]) => !["Size", "Color"].includes(k))
            .map(([k, val]) => `${k}: ${val}`)
            .join("\n"),
        };
      }),
    );
    setErrors([]);
    setMessage("");
    document
      .getElementById("product-editor")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  async function uploadFiles(files: FileList | File[]) {
    const nextErrors: string[] = [];
    for (const file of Array.from(files)) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        nextErrors.push(`${file.name}: use JPG, PNG, or WebP.`);
        continue;
      }
      if (file.size > 2 * 1024 * 1024) {
        nextErrors.push(`${file.name}: file is larger than 2 MB.`);
        continue;
      }
      let bitmap: ImageBitmap;
      try {
        bitmap = await createImageBitmap(file);
      } catch {
        nextErrors.push(`${file.name}: the image could not be read.`);
        continue;
      }
      if (bitmap.width < 1000 || bitmap.height < 1000) {
        nextErrors.push(
          `${file.name}: minimum dimensions are 1000 × 1000 px (received ${bitmap.width} × ${bitmap.height}).`,
        );
        bitmap.close();
        continue;
      }
      const ratio = bitmap.width / bitmap.height;
      bitmap.close();
      if (Math.abs(ratio - 1) > 0.08)
        nextErrors.push(`${file.name}: image is uploaded, but a square crop is recommended.`);
      const form = new FormData();
      form.set("file", file);
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: form,
      });
      const result = await response.json();
      if (!response.ok) {
        nextErrors.push(`${file.name}: ${result.error ?? "upload failed"}`);
        continue;
      }
      setMedia((prev) => [
        ...prev,
        {
          url: result.url,
          alt: title || file.name.replace(/\.[^.]+$/, ""),
          name: file.name,
        },
      ]);
    }
    setErrors(nextErrors);
  }
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    const nextErrors: string[] = [];
    let specifications: Record<string, string>;
    try {
      specifications = JSON.parse(specs);
      if (
        !specifications ||
        Array.isArray(specifications) ||
        typeof specifications !== "object" ||
        Object.values(specifications).some((v) => typeof v !== "string")
      )
        throw new Error();
    } catch {
      nextErrors.push("Specifications must be a JSON object with text values.");
      specifications = {};
    }
    if (
      !variants.length ||
      variants.some((v) => !v.sku || !Number(v.price) || Number(v.stockQuantity) < 0)
    )
      nextErrors.push("Each variant needs a SKU, price, and valid stock quantity.");
    if (variants.some((v) => v.salePrice && Number(v.salePrice) >= Number(v.price)))
      nextErrors.push("Each sale price must be less than its regular price.");
    if (nextErrors.length) {
      setErrors(nextErrors);
      setBusy(false);
      return;
    }
    const payload = {
      title,
      slug,
      description,
      fitType: fitType || null,
      material: material || null,
      categoryId: categoryId || null,
      isPublished: published,
      isUpcoming: upcoming,
      featuredOffer,
      featuredUpcoming,
      launchAt: launchAt ? new Date(launchAt).toISOString() : null,
      seoTitle,
      seoDescription,
      specifications,
      media: media.map(({ url, alt }) => ({ url, alt })),
      variants: variants.map((v) => ({
        ...(v.id ? { id: v.id } : {}),
        sku: v.sku,
        price: Number(v.price),
        salePrice: v.salePrice ? Number(v.salePrice) : null,
        stockQuantity: Number(v.stockQuantity),
        attributesJson: attrs(v),
      })),
    };
    try {
      const response = await fetch(
        editing ? `/api/admin/products/${editing}` : "/api/admin/products",
        {
          method: editing ? "PUT" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const result = await response.json();
      if (!response.ok) {
        const details = Array.isArray(result.details)
          ? result.details.filter((detail: unknown) => typeof detail === "string")
          : [];
        throw new Error([result.error ?? "Could not save product.", ...details].join("\n"));
      }
      setMessage(editing ? "Product changes saved." : "Product created.");
      reset();
      router.refresh();
    } catch (error) {
      setErrors([
        ...(error instanceof Error ? error.message.split("\n") : ["Could not save product."]),
      ]);
    } finally {
      setBusy(false);
    }
  }
  function setVariant(index: number, key: keyof VariantDraft, value: string) {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, [key]: value } : v)));
  }
  function moveMedia(index: number, delta: number) {
    setMedia((prev) => {
      const next = [...prev],
        to = index + delta;
      if (to < 0 || to >= next.length) return prev;
      [next[index], next[to]] = [next[to], next[index]];
      return next;
    });
  }
  return (
    <div className="mt-8 grid items-start gap-8 xl:grid-cols-[.8fr_1.2fr]">
      <section className="order-2 xl:order-1">
        <div className="mb-4">
          <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-[#52745b]">
            Catalog
          </p>
          <h2 className="mt-1 font-serif text-3xl text-[#1b3b2b]">Products & editions</h2>
        </div>
        <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_170px]">
          <input
            aria-label="Search products by name, category, or SKU"
            value={catalogQuery}
            onChange={(e) => setCatalogQuery(e.target.value)}
            placeholder="Search by product, category, or SKU"
            className="rounded-xl border border-[#1b3b2b]/15 bg-white px-4 py-3 text-sm text-[#212529] placeholder:text-[#66736a]"
          />
          <select
            aria-label="Filter catalog by category"
            value={catalogCategory}
            onChange={(e) => setCatalogCategory(e.target.value)}
            className="rounded-xl border border-[#1b3b2b]/15 bg-white px-3 py-3 text-sm text-[#34473b]"
          >
            <option value="">All categories</option>
            {categoryOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-3">
          {visibleProducts.map((p) => (
            <article
              key={p.id}
              className="flex items-center gap-4 rounded-2xl border border-[#1b3b2b]/10 bg-white p-4"
            >
              <div className="size-14 shrink-0 overflow-hidden rounded-xl bg-[#e9efe7]">
                {p.media[0]?.url || p.imageUrl ? (
                  <img
                    src={p.media[0]?.url ?? p.imageUrl ?? ""}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#263a2c]">{p.title}</p>
                <p className="mt-1 truncate text-xs text-[#56645a]">
                  {p.category?.name ?? "Uncategorized"} ·{" "}
                  {p.isUpcoming ? "Upcoming · " : p.isPublished ? "Published · " : "Draft · "}
                  {p.variants.length} variant(s)
                </p>
              </div>
              <button
                type="button"
                onClick={() => choose(p)}
                className="rounded-full border border-[#1b3b2b]/15 px-4 py-2 text-xs font-medium text-[#1b3b2b] hover:bg-[#edf3eb]"
              >
                Edit
              </button>
            </article>
          ))}
          {!visibleProducts.length && (
            <div className="rounded-2xl border border-dashed border-[#1b3b2b]/20 p-6 text-sm text-[#56645a]">
              {products.length
                ? "No products match these filters."
                : "No products yet. Create the first one here."}
            </div>
          )}
        </div>
      </section>
      <section
        id="product-editor"
        className="order-1 scroll-mt-24 rounded-[1.6rem] border border-[#1b3b2b]/10 bg-white p-5 shadow-sm xl:order-2 sm:p-7"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#73917a]">
              {editing ? "Update listing" : "New listing"}
            </p>
            <h2 className="mt-1 font-serif text-2xl text-[#1b3b2b]">
              {editing ? `Edit ${existing?.title ?? "product"}` : "Create a product"}
            </h2>
          </div>
          {editing && (
            <button
              type="button"
              onClick={reset}
              className="rounded-full p-2 text-[#68786c] hover:bg-[#eef2ed]"
              aria-label="Close editor"
            >
              <X size={17} />
            </button>
          )}
        </div>
        <form onSubmit={submit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Product title">
              <input
                required
                minLength={2}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (!editing)
                    setSlug(
                      e.target.value
                        .toLowerCase()
                        .trim()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/(^-|-$)/g, ""),
                    );
                }}
                className="field"
                placeholder="The everyday carry tote"
              />
            </Field>
            <Field label="URL slug">
              <input
                required
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="field"
                placeholder="everyday-carry-tote"
              />
            </Field>
            <div>
              <Field label="Category">
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="field"
                >
                  <option value="">Uncategorized</option>
                  {categoryOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <button
                type="button"
                onClick={addCategory}
                className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium text-[#4d7053]"
              >
                <Plus size={12} /> Add category
              </button>
            </div>
            <Field label="Product state">
              <div className="flex h-11 items-center gap-5">
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={published}
                    onChange={(e) => setPublished(e.target.checked)}
                  />{" "}
                  Published
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={upcoming}
                    onChange={(e) => {
                      setUpcoming(e.target.checked);
                      if (!e.target.checked) setFeaturedUpcoming(false);
                    }}
                  />{" "}
                  Upcoming
                </label>
              </div>
            </Field>
          </div>
          <Field label="Homepage placement">
            <div className="flex flex-wrap items-center gap-5 rounded-xl bg-[#f6f8f4] px-4 py-3">
              <label className="flex items-center gap-2 text-xs font-medium text-[#34473b]">
                <input
                  type="checkbox"
                  checked={featuredOffer}
                  onChange={(e) => setFeaturedOffer(e.target.checked)}
                />
                Feature in Offers
              </label>
              <label className="flex items-center gap-2 text-xs font-medium text-[#34473b]">
                <input
                  type="checkbox"
                  checked={featuredUpcoming}
                  disabled={!upcoming}
                  onChange={(e) => setFeaturedUpcoming(e.target.checked)}
                />
                Feature in Coming Soon
              </label>
              <span className="text-[10px] text-[#738075]">
                Offers need a sale price; Coming Soon needs Upcoming enabled.
              </span>
            </div>
          </Field>
          <Field label="Product description">
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="field resize-y"
              placeholder="Describe the materials, craft, and details…"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Fit type">
              <select
                value={fitType}
                onChange={(e) => setFitType(e.target.value)}
                className="field"
              >
                <option value="">Choose fit</option>
                <option>Regular</option>
                <option>Slim</option>
                <option>Oversized</option>
                <option>Relaxed</option>
              </select>
            </Field>
            <Field label="Fabric / material">
              <input
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                className="field"
                placeholder="Organic cotton, linen, denim…"
              />
            </Field>
          </div>
          <div>
            <div className="mb-2 flex items-end justify-between">
              <div>
                <p className="text-xs font-semibold text-[#304536]">Product images</p>
                <p className="mt-1 text-[10px] text-[#859087]">
                  JPG, PNG, WebP · up to 2 MB · at least 1000 × 1000 px · square crop recommended
                </p>
              </div>
              <span className="text-[10px] text-[#859087]">{media.length}/10</span>
            </div>
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                void uploadFiles(e.dataTransfer.files);
              }}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-5 py-7 text-center transition ${dragging ? "border-[#1b3b2b] bg-[#edf3eb]" : "border-[#1b3b2b]/20 bg-[#fafbf8] hover:bg-[#f1f5f0]"}`}
            >
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="sr-only"
                onChange={(e) => {
                  if (e.target.files) void uploadFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              <span className="grid size-10 place-items-center rounded-full bg-[#e7efe5] text-[#42644c]">
                <UploadCloud size={18} />
              </span>
              <span className="mt-3 text-xs font-medium text-[#33483a]">
                Drop images here or browse files
              </span>
              <span className="mt-1 text-[10px] text-[#849086]">
                Upload up to 10. Reorder images after upload.
              </span>
            </label>
            {media.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5">
                {media.map((m, i) => (
                  <div
                    key={`${m.url}-${i}`}
                    className="group relative aspect-square overflow-hidden rounded-xl bg-[#eef2ed]"
                  >
                    <img src={m.url} alt={m.alt} className="h-full w-full object-cover" />
                    <span className="absolute left-1.5 top-1.5 rounded-full bg-black/55 px-2 py-1 text-[9px] text-white">
                      {i === 0 ? "Cover" : i + 1}
                    </span>
                    <div className="absolute inset-x-1 bottom-1 flex justify-between">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          aria-label="Move image left"
                          disabled={i === 0}
                          onClick={() => moveMedia(i, -1)}
                          className="rounded bg-white/90 p-1 disabled:opacity-30"
                        >
                          <ArrowUp size={12} />
                        </button>
                        <button
                          type="button"
                          aria-label="Move image right"
                          disabled={i === media.length - 1}
                          onClick={() => moveMedia(i, 1)}
                          className="rounded bg-white/90 p-1 disabled:opacity-30"
                        >
                          <ArrowDown size={12} />
                        </button>
                      </div>
                      <button
                        type="button"
                        aria-label="Remove image"
                        onClick={() => setMedia(media.filter((_, j) => j !== i))}
                        className="rounded bg-white/90 p-1 text-red-700"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[#304536]">Variants & pricing</p>
                <p className="mt-1 text-[10px] text-[#859087]">
                  Set a unique SKU, price, availability, and size or color for each option.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setVariants([...variants, blankVariant()])}
                className="inline-flex items-center gap-1 rounded-full border border-[#1b3b2b]/15 px-3 py-2 text-[10px] font-medium"
              >
                <Plus size={13} /> Add variant
              </button>
            </div>
            <div className="space-y-3">
              {variants.map((v, i) => (
                <div key={v.id ?? i} className="rounded-2xl bg-[#f5f7f3] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6e8071]">
                      Option {i + 1}
                    </p>
                    {variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setVariants(variants.filter((_, j) => j !== i))}
                        className="text-xs text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <SmallInput
                      label="SKU"
                      value={v.sku}
                      onChange={(x) => setVariant(i, "sku", x)}
                      required
                    />
                    <SmallInput
                      label="Regular price"
                      type="number"
                      value={v.price}
                      onChange={(x) => setVariant(i, "price", x)}
                      required
                    />
                    <SmallInput
                      label="Sale price"
                      type="number"
                      value={v.salePrice}
                      onChange={(x) => setVariant(i, "salePrice", x)}
                    />
                    <SmallInput
                      label="Stock quantity"
                      type="number"
                      value={v.stockQuantity}
                      onChange={(x) => setVariant(i, "stockQuantity", x)}
                      required
                    />
                    <SmallInput
                      label="Size"
                      value={v.size}
                      onChange={(x) => setVariant(i, "size", x)}
                    />
                    <SmallInput
                      label="Color"
                      value={v.color}
                      onChange={(x) => setVariant(i, "color", x)}
                    />
                  </div>
                  <label className="mt-3 block text-[10px] text-[#6f7f72]">
                    Additional attributes, one per line (e.g. Material: Organic cotton)
                    <textarea
                      rows={2}
                      value={v.other}
                      onChange={(e) => setVariant(i, "other", e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[#1b3b2b]/10 bg-white px-3 py-2 text-xs outline-none focus:border-[#84a98c]"
                    />
                  </label>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="SEO title · 70 characters max">
              <input
                maxLength={70}
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                className="field"
                placeholder={title || "Search result title"}
              />
            </Field>
            <Field label="SEO description · 180 characters max">
              <textarea
                maxLength={180}
                rows={2}
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                className="field resize-y"
                placeholder="Short search preview…"
              />
            </Field>
          </div>
          <Field label="Specifications · JSON object of text values">
            <textarea
              rows={3}
              value={specs}
              onChange={(e) => setSpecs(e.target.value)}
              className="field font-mono text-xs"
              placeholder={'{"Material":"Recycled cotton","Origin":"Portugal"}'}
            />
          </Field>
          {upcoming && (
            <Field label="Launch date">
              <input
                type="datetime-local"
                value={launchAt}
                onChange={(e) => setLaunchAt(e.target.value)}
                className="field"
              />
            </Field>
          )}
          {errors.length > 0 && (
            <div
              role="alert"
              className="space-y-1 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800"
            >
              {errors.map((error, i) => (
                <p key={i}>• {error}</p>
              ))}
            </div>
          )}
          {message && (
            <p role="status" className="inline-flex items-center gap-2 text-xs text-[#496b50]">
              <Check size={14} />
              {message}
            </p>
          )}
          <div className="flex flex-wrap gap-2 border-t border-[#1b3b2b]/10 pt-5">
            <button
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-full bg-[#1b3b2b] px-5 py-3 text-xs font-medium text-white disabled:opacity-50"
            >
              {busy ? <LoaderCircle size={15} className="animate-spin" /> : <Save size={15} />}{" "}
              {editing ? "Save product" : "Create product"}
            </button>
            {editing && (
              <button
                type="button"
                onClick={reset}
                className="rounded-full border border-[#1b3b2b]/15 px-5 py-3 text-xs"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>
      <style jsx>{`
        .field {
          display: block;
          width: 100%;
          margin-top: 0.4rem;
          border: 1px solid rgba(27, 59, 43, 0.13);
          border-radius: 0.8rem;
          background: #fff;
          padding: 0.7rem 0.85rem;
          font-size: 0.8rem;
          outline: none;
        }
        .field:focus {
          border-color: #84a98c;
          box-shadow: 0 0 0 3px rgba(132, 169, 140, 0.14);
        }
      `}</style>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-[10px] font-medium text-[#607064]">
      {label}
      {children}
    </label>
  );
}
function SmallInput({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-[10px] text-[#68786c]">
      {label}
      <input
        required={required}
        min={type === "number" ? "0" : undefined}
        step={label.includes("price") ? "0.01" : undefined}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-[#1b3b2b]/10 bg-white px-2.5 py-2 text-xs outline-none focus:border-[#84a98c]"
      />
    </label>
  );
}
