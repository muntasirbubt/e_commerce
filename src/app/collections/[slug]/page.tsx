import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getStoreSettings } from "@/lib/config";
import { ShopCatalog, type CatalogSearchParams } from "@/components/shop-catalog";

async function findCategory(slug: string) {
  try {
    return await db.category.findUnique({ where: { slug } });
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const [{ slug }, { storeName }] = await Promise.all([params, getStoreSettings()]);
  const category = await findCategory(slug);
  if (!category) return { title: `Collection not found | ${storeName}` };
  return {
    title: `${category.name} | ${storeName}`,
    description: `Shop ${category.name.toLowerCase()} from ${storeName}. Filter by size, color, fit and fabric.`,
    alternates: { canonical: `/collections/${category.slug}` },
  };
}

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<CatalogSearchParams>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const category = await findCategory(slug);
  if (!category) notFound();
  return (
    <main>
      <ShopCatalog
        params={query}
        basePath={`/collections/${category.slug}`}
        lockedCategory={category.slug}
        eyebrow="Collection"
        heading={category.name}
      />
    </main>
  );
}
