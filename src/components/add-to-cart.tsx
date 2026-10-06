"use client";
import { useMemo, useState } from "react";

type Variant = {
  id: string;
  sku: string;
  price: number;
  salePrice?: number | null;
  stockQuantity: number;
  attributes: Record<string, string>;
};
const swatchColors: Record<string, string> = {
  black: "#171717",
  white: "#f7f5ef",
  cream: "#efe5cf",
  ivory: "#efe9dd",
  sage: "#84a98c",
  green: "#496b50",
  "forest green": "#1b3b2b",
  brown: "#795548",
  blue: "#607d8b",
  red: "#b65c4d",
  pink: "#dfa7a0",
  yellow: "#e7c75c",
  gray: "#858585",
  grey: "#858585",
};
const normalized = (s: string) => s.trim().toLowerCase();

export function AddToCart({
  variants,
  currency = "USD",
}: {
  variants: Variant[];
  currency?: string;
}) {
  const available = variants.filter((v) => v.stockQuantity > 0);
  const colors = useMemo(
    () => [
      ...new Set(
        available
          .map((v) => v.attributes.Color ?? v.attributes.Colour)
          .filter(Boolean),
      ),
    ],
    [variants],
  );
  const sizes = useMemo(
    () => [...new Set(available.map((v) => v.attributes.Size).filter(Boolean))],
    [variants],
  );
  const [color, setColor] = useState(colors[0] ?? "");
  const matching = available.filter(
    (v) =>
      !color ||
      normalized(v.attributes.Color ?? v.attributes.Colour ?? "") ===
        normalized(color),
  );
  const [variantId, setVariantId] = useState(
    matching[0]?.id ?? available[0]?.id ?? "",
  );
  const current = variants.find((v) => v.id === variantId);
  const effectiveColor =
    current?.attributes.Color ?? current?.attributes.Colour ?? "";
  const currentColorVariants = available.filter(
    (v) =>
      !effectiveColor ||
      normalized(v.attributes.Color ?? v.attributes.Colour ?? "") ===
        normalized(effectiveColor),
  );
  const sizeVariants = sizes.length
    ? currentColorVariants.filter((v) => v.attributes.Size)
    : currentColorVariants;
  const selectedSize = current?.attributes.Size ?? "";
  const selected =
    sizeVariants.find((v) => v.attributes.Size === selectedSize) ??
    (sizes.length
      ? sizeVariants[0]
      : (currentColorVariants.find((v) => v.id === variantId) ??
        currentColorVariants[0]));
  const price =
    selected?.salePrice && selected.salePrice < selected.price
      ? selected.salePrice
      : selected?.price;
  const [qty, setQty] = useState(1);
  const [message, setMessage] = useState("");

  function chooseColor(next: string) {
    setColor(next);
    const nextMatch = available.find(
      (v) =>
        normalized(v.attributes.Color ?? v.attributes.Colour ?? "") ===
        normalized(next),
    );
    if (nextMatch) setVariantId(nextMatch.id);
    setQty(1);
  }
  function chooseSize(size: string) {
    const next = currentColorVariants.find((v) => v.attributes.Size === size);
    if (next) setVariantId(next.id);
    setQty(1);
  }
  function add() {
    if (!selected || selected.stockQuantity < qty) return;
    const cart = JSON.parse(localStorage.getItem("cart") ?? "[]") as {
      variantId: string;
      quantity: number;
    }[];
    const found = cart.find((x) => x.variantId === selected.id);
    if (found) found.quantity += qty;
    else cart.push({ variantId: selected.id, quantity: qty });
    localStorage.setItem("cart", JSON.stringify(cart));
    setMessage("Added to your cart.");
  }
  if (!available.length)
    return (
      <button
        disabled
        className="mt-8 rounded-full bg-black/20 px-7 py-3 text-white"
      >
        Out of stock
      </button>
    );

  return (
    <div className="mt-8 space-y-5">
      {colors.length > 0 && (
        <fieldset>
          <legend className="text-sm font-medium">
            Color{" "}
            <span className="text-stone-500">
              ·{" "}
              {selected?.attributes.Color ??
                selected?.attributes.Colour ??
                color}
            </span>
          </legend>
          <div className="mt-3 flex flex-wrap gap-3">
            {colors.map((name) => (
              <button
                type="button"
                key={name}
                onClick={() => chooseColor(name)}
                aria-label={`Choose ${name}`}
                aria-pressed={
                  normalized(name) === normalized(effectiveColor || color)
                }
                title={name}
                className={`grid size-9 place-items-center rounded-full border-2 transition ${normalized(name) === normalized(effectiveColor || color) ? "border-[#1b3b2b] ring-2 ring-[#84a98c] ring-offset-2" : "border-white shadow-sm"}`}
                style={{
                  backgroundColor: swatchColors[normalized(name)] ?? name,
                }}
              >
                <span className="sr-only">{name}</span>
              </button>
            ))}
          </div>
        </fieldset>
      )}
      {sizes.length > 0 && (
        <label className="block text-sm font-medium">
          Size
          <select
            value={selectedSize}
            onChange={(e) => chooseSize(e.target.value)}
            className="mt-2 block w-full rounded-xl border border-[#dedfd8] bg-white px-4 py-3"
          >
            {[
              ...new Set(
                currentColorVariants
                  .map((v) => v.attributes.Size)
                  .filter(Boolean),
              ),
            ].map((size) => {
              const v = currentColorVariants.find(
                (x) => x.attributes.Size === size,
              );
              return (
                <option key={size} value={size} disabled={!v?.stockQuantity}>
                  {size}
                  {v?.stockQuantity ? "" : " · sold out"}
                </option>
              );
            })}
          </select>
        </label>
      )}
      {!colors.length && !sizes.length && variants.length > 1 && (
        <label className="block text-sm font-medium">
          Choose an option
          <select
            value={selected?.id ?? ""}
            onChange={(e) => setVariantId(e.target.value)}
            className="mt-2 block w-full rounded-xl border border-[#dedfd8] bg-white px-4 py-3"
          >
            {variants.map((v) => (
              <option disabled={!v.stockQuantity} key={v.id} value={v.id}>
                {Object.values(v.attributes).join(" / ") || v.sku}
                {v.stockQuantity ? "" : " · sold out"}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="flex flex-wrap gap-3">
        <input
          aria-label="Quantity"
          type="number"
          min={1}
          max={selected?.stockQuantity ?? 1}
          value={qty}
          onChange={(e) =>
            setQty(
              Math.min(
                selected?.stockQuantity ?? 1,
                Math.max(1, Number(e.target.value)),
              ),
            )
          }
          className="w-20 rounded-xl border border-[#dedfd8] bg-white px-3"
        />
        <button
          onClick={add}
          disabled={!selected}
          className="rounded-full bg-[#1b3b2b] px-7 py-3 text-white transition hover:bg-[#31543c] disabled:opacity-50"
        >
          Add to bag · {currency} {(price ?? 0).toFixed(2)}
        </button>
      </div>
      {selected && (
        <p className="text-sm text-stone-500">
          {selected.stockQuantity <= 5
            ? `Only ${selected.stockQuantity} left`
            : "In stock"}
        </p>
      )}
      {message && (
        <p className="text-sm text-[#496b50]">
          {message}{" "}
          <a className="underline" href="/checkout">
            Checkout
          </a>
        </p>
      )}
    </div>
  );
}
