"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ExternalLink, LoaderCircle } from "lucide-react";

type Product = {
  id: string;
  title: string;
  imageUrl: string | null;
  isPublished: boolean;
  isUpcoming: boolean;
  featuredOffer: boolean;
  featuredUpcoming: boolean;
  hasSalePrice: boolean;
};

export function HomepageCurationManager({ initial }: { initial: Product[] }) {
  const [products, setProducts] = useState(initial);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function update(product: Product, changes: Partial<Product>) {
    const next = { ...product, ...changes };
    setProducts((current) => current.map((item) => (item.id === product.id ? next : item)));
    setSaving(product.id);
    setMessage("");
    const response = await fetch(`/api/admin/products/${product.id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(changes),
    });
    const result = await response.json();
    setSaving(null);
    if (!response.ok) {
      setProducts((current) => current.map((item) => (item.id === product.id ? product : item)));
      setMessage(result.error ?? "Could not update homepage placement.");
      return;
    }
    setMessage(`${product.title} placement saved.`);
  }

  return (
    <div className="mt-7">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-[#657367]">
            Select the products shoppers should see in each homepage block.
          </p>
          <p className="mt-1 text-xs text-[#829087]">
            Only published products appear on the storefront. Offers also require a sale price.
          </p>
        </div>
        <Link
          href="/"
          target="_blank"
          className="inline-flex items-center gap-2 rounded-full border border-[#1b3b2b]/15 bg-white px-4 py-2.5 text-xs font-semibold text-[#315a3b]"
        >
          Preview home <ExternalLink size={14} />
        </Link>
      </div>
      {message && (
        <p role="status" className="mb-4 rounded-xl bg-[#e8f0e6] px-4 py-3 text-xs text-[#315a3b]">
          {message}
        </p>
      )}
      <div className="overflow-x-auto rounded-2xl border border-[#1b3b2b]/10 bg-white">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[minmax(240px,1fr)_150px_170px_130px] gap-4 border-b border-[#1b3b2b]/10 bg-[#f5f7f3] px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-[#748176]">
            <span>Product</span>
            <span>Visibility</span>
            <span>Offers block</span>
            <span>Coming Soon</span>
          </div>
          {products.map((product) => (
            <article
              key={product.id}
              className="grid grid-cols-[minmax(240px,1fr)_150px_170px_130px] items-center gap-4 border-b border-[#1b3b2b]/[.07] px-5 py-3 last:border-0"
            >
              <div className="flex min-w-0 items-center gap-3">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt=""
                    className="size-12 rounded-lg bg-[#f0f3ee] object-cover"
                  />
                ) : (
                  <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-[#e8eee6] font-serif text-xl text-[#52745b]">
                    {product.title.slice(0, 1)}
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-[#263a2c]">
                    {product.title}
                  </span>
                  <span className="mt-1 block text-[10px] text-[#7a887d]">
                    {product.isUpcoming ? "Upcoming" : "Regular product"}
                    {product.hasSalePrice ? " · Sale price set" : " · No sale price"}
                  </span>
                </span>
              </div>
              <span
                className={`text-xs font-medium ${product.isPublished ? "text-emerald-700" : "text-amber-700"}`}
              >
                {product.isPublished ? "Published" : "Draft"}
              </span>
              <label className="flex items-center gap-2 text-xs font-medium text-[#34473b]">
                <input
                  type="checkbox"
                  checked={product.featuredOffer}
                  disabled={
                    saving === product.id ||
                    ((!product.isPublished || !product.hasSalePrice) && !product.featuredOffer)
                  }
                  onChange={(event) =>
                    void update(product, { featuredOffer: event.target.checked })
                  }
                  className="size-4 accent-[#1b3b2b]"
                />
                Show in Offers
                {saving === product.id && <LoaderCircle size={13} className="animate-spin" />}
              </label>
              <label className="flex items-center gap-2 text-xs font-medium text-[#34473b]">
                <input
                  type="checkbox"
                  checked={product.featuredUpcoming && product.isUpcoming}
                  disabled={
                    saving === product.id || (!product.isPublished && !product.featuredUpcoming)
                  }
                  onChange={(event) =>
                    void update(product, {
                      isUpcoming: event.target.checked,
                      featuredUpcoming: event.target.checked,
                    })
                  }
                  className="size-4 accent-[#1b3b2b]"
                />
                Show drop
              </label>
            </article>
          ))}
          {!products.length && (
            <p className="px-5 py-10 text-center text-sm text-[#718075]">
              Create a product in Catalog Studio, then select it here.
            </p>
          )}
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-3 text-xs text-[#657367]">
        <span className="inline-flex items-center gap-1.5">
          <Check size={14} className="text-[#52745b]" /> Changes save immediately
        </span>
        <span>
          For an upcoming drop, set a launch date in Catalog Studio to show the countdown.
        </span>
      </div>
    </div>
  );
}
