import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getStoreSettings } from "@/lib/config";
import { AddToCart } from "@/components/add-to-cart";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, settings] = await Promise.all([db.product.findUnique({ where: { slug, isPublished: true }, include: { variants: true, category: true } }).catch(() => null), getStoreSettings()]);
  if (!product) notFound();
  const stock = product.variants.reduce((n, v) => n + v.stockQuantity, 0);
  return <main className="mx-auto grid max-w-6xl gap-12 px-6 py-14 md:grid-cols-2"><div className="flex aspect-square items-center justify-center overflow-hidden rounded-3xl bg-[#e7eddf] text-8xl">{product.imageUrl ? <img src={product.imageUrl} alt={product.title} className="h-full w-full object-cover"/> : "✳"}</div><div className="py-8"><p className="text-sm uppercase tracking-widest text-[#719159]">{product.category?.name ?? "Collection"}</p><h1 className="mt-3 text-4xl font-semibold">{product.title}</h1><p className="mt-5 text-2xl">{settings.currency} {(product.variants.length ? Math.min(...product.variants.map(v => Number(v.price))) : 0).toFixed(2)}</p><p className="mt-6 leading-7 text-black/60">{product.description}</p><p className="mt-5 text-sm font-medium">{stock === 0 ? "Out of stock" : stock <= settings.lowStockThreshold ? `Only ${stock} left` : "In stock"}</p><AddToCart variants={product.variants.map(v => ({ id: v.id, sku: v.sku, price: Number(v.price), stockQuantity: v.stockQuantity, attributes: v.attributesJson as Record<string, string> }))}/></div></main>;
}
