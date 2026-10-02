"use client";
import { useState } from "react";
type Variant = { id: string; sku: string; price: number; stockQuantity: number; attributes: Record<string, string> };
export function AddToCart({ variants }: { variants: Variant[] }) {
  const [variantId, setVariantId] = useState(variants[0]?.id ?? "");
  const [qty, setQty] = useState(1);
  const [message, setMessage] = useState("");
  const selected = variants.find(v => v.id === variantId);
  function add() { if (!selected || selected.stockQuantity < qty) return; const cart = JSON.parse(localStorage.getItem("cart") ?? "[]") as { variantId: string; quantity: number }[]; const found = cart.find(x => x.variantId === variantId); if (found) found.quantity += qty; else cart.push({ variantId, quantity: qty }); localStorage.setItem("cart", JSON.stringify(cart)); setMessage("Added to your cart."); }
  if (!variants.length || variants.every(v => v.stockQuantity < 1)) return <button disabled className="mt-8 rounded-full bg-black/20 px-7 py-3 text-white">Unavailable</button>;
  return <div className="mt-8">{variants.length > 1 && <label className="block text-sm">Choose an option<select value={variantId} onChange={e => setVariantId(e.target.value)} className="mt-2 block w-full rounded-xl border bg-white px-4 py-3">{variants.map(v => <option disabled={!v.stockQuantity} key={v.id} value={v.id}>{Object.values(v.attributes).join(" / ") || v.sku} — ${v.price.toFixed(2)} {v.stockQuantity ? "" : "(sold out)"}</option>)}</select></label>}<div className="mt-4 flex gap-3"><input aria-label="Quantity" type="number" min={1} max={selected?.stockQuantity ?? 1} value={qty} onChange={e => setQty(Math.max(1, Number(e.target.value)))} className="w-20 rounded-xl border bg-white px-3"/><button onClick={add} className="rounded-full bg-[#17231f] px-7 py-3 text-white">Add to cart</button></div>{message && <p className="mt-3 text-sm text-[#496b50]">{message} <a className="underline" href="/checkout">Checkout</a></p>}</div>;
}
