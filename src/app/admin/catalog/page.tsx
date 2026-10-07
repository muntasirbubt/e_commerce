import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { AdminProductManager } from "@/components/admin-product-manager";
import Link from "next/link";
import { Plus } from "lucide-react";
export default async function CatalogPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/signin?callbackUrl=/admin/catalog");
  if (session.user.role !== "ADMIN") redirect("/");
  const [products, categories] = await Promise.all([
    db.product.findMany({
      include: {
        variants: true,
        category: true,
        media: { orderBy: { position: "asc" } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    db.category.findMany({ orderBy: { name: "asc" } }),
  ]);
  return (
    <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
      <Link href="/admin" className="text-xs text-[#56645a]">
        ← Back to dashboard
      </Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-[#52745b]">
            Store management
          </p>
          <h1 className="mt-1 font-serif text-4xl text-[#1b3b2b]">Catalog studio</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#56645a]">
            Create considered product listings, manage variants, and prepare upcoming launches.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/homepage"
            className="rounded-full border border-[#1b3b2b]/20 bg-white px-4 py-3 text-sm font-semibold text-[#1b3b2b]"
          >
            Homepage blocks
          </Link>
          <a
            href="#product-editor"
            className="inline-flex items-center gap-2 rounded-full border border-[#1b3b2b] bg-[#dce9db] px-5 py-3 text-sm font-semibold text-[#163823] shadow-sm transition hover:bg-[#c8dcc8]"
          >
            <span className="grid size-7 place-items-center rounded-full bg-[#1b3b2b] text-white">
              <Plus size={16} />
            </span>
            Create product
          </a>
        </div>
      </div>
      <AdminProductManager
        products={JSON.parse(JSON.stringify(products))}
        categories={categories}
      />
    </main>
  );
}
