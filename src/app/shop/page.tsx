import type { Metadata } from "next";
import { ShopCatalog, type CatalogSearchParams } from "@/components/shop-catalog";
import { getStoreSettings } from "@/lib/config";

export async function generateMetadata(): Promise<Metadata> {
  const { storeName } = await getStoreSettings();
  return {
    title: `Shop all clothing | ${storeName}`,
    description: `Browse every piece from ${storeName} — filter by size, color, fit, fabric and price.`,
    alternates: { canonical: "/shop" },
  };
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<CatalogSearchParams> }) {
  const params = await searchParams;
  return (
    <main>
      <ShopCatalog params={params} basePath="/shop" eyebrow="The collection" heading="Shop all" />
    </main>
  );
}
