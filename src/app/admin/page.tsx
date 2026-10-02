import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getStoreSettings } from "@/lib/config";
import { AdminPanel } from "@/components/admin-panel";
export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/signin?callbackUrl=/admin");
  if (session.user.role !== "ADMIN") redirect("/");
  const [products, orders, logs, settings, sales, lowStock] = await Promise.all([
    db.product.findMany({ include: { variants: true, category: true }, orderBy: { createdAt: "desc" } }),
    db.order.findMany({ include: { items: true }, orderBy: { createdAt: "desc" }, take: 10 }),
    db.inventoryLog.findMany({ include: { variant: { include: { product: true } } }, orderBy: { createdAt: "desc" }, take: 12 }),
    getStoreSettings(),
    db.order.aggregate({ where: { paymentStatus: "PAID" }, _sum: { totalAmount: true }, _count: true }),
    db.productVariant.count({ where: { stockQuantity: { lte: 5 } } }),
  ]);
  return <main className="mx-auto max-w-7xl px-6 py-12"><p className="text-sm uppercase tracking-widest text-[#719159]">Store management</p><h1 className="mt-2 text-4xl font-semibold">Dashboard</h1><div className="mt-8 grid gap-4 sm:grid-cols-3"><Metric label="Paid sales" value={`${settings.currency} ${Number(sales._sum.totalAmount ?? 0).toFixed(2)}`}/><Metric label="Paid orders" value={String(sales._count)}/><Metric label="Low stock variants" value={String(lowStock)}/></div><AdminPanel products={JSON.parse(JSON.stringify(products))} orders={JSON.parse(JSON.stringify(orders))} logs={JSON.parse(JSON.stringify(logs))} settings={settings}/></main>;
}
function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-white p-5"><p className="text-sm text-black/50">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>; }
