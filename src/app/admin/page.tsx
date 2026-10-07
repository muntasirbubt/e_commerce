import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getStoreSettings } from "@/lib/config";
import { AdminPanel } from "@/components/admin-panel";
import Link from "next/link";
import { ClipboardList, Home, PackagePlus, Tag, UsersRound } from "lucide-react";
import { getBusinessDayRange } from "@/lib/business-date";
import { StaffOperations } from "@/components/staff-operations";
export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/signin?callbackUrl=/admin");
  if (session.user.role === "STAFF") {
    const { start: startOfToday, end: startOfTomorrow } = getBusinessDayRange();
    const [stock, orders, logs, settings] = await Promise.all([
      db.productVariant.findMany({
        where: { product: { isPublished: true } },
        include: { product: { select: { title: true } } },
        orderBy: [{ product: { title: "asc" } }, { sku: "asc" }],
      }),
      db.order.findMany({
        where: {
          createdAt: { gte: startOfToday, lt: startOfTomorrow },
          status: { not: "CANCELLED" },
        },
        include: {
          items: {
            include: {
              variant: { include: { product: { select: { title: true } } } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      db.inventoryLog.findMany({
        include: { variant: { include: { product: { select: { title: true } } } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      db.storeSettings.findUnique({ where: { id: 1 }, select: { lowStockThreshold: true } }),
    ]);
    return (
      <StaffOperations
        stock={stock.map((variant) => ({
          id: variant.id,
          sku: variant.sku,
          stockQuantity: variant.stockQuantity,
          attrs: Object.values(variant.attributesJson as Record<string, string>).join(" / "),
          title: variant.product.title,
        }))}
        orders={orders.map((order) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          status: order.status,
          createdAt: order.createdAt.toISOString(),
          items: order.items.map((item) => ({
            title: item.variant.product.title,
            quantity: item.quantity,
          })),
        }))}
        logs={logs.map((log) => ({
          id: log.id,
          changeQuantity: log.changeQuantity,
          reason: log.reason,
          createdAt: log.createdAt.toISOString(),
          sku: log.variant.sku,
          title: log.variant.product.title,
        }))}
        lowStockThreshold={
          settings?.lowStockThreshold ?? Number(process.env.LOW_STOCK_THRESHOLD ?? 5)
        }
      />
    );
  }
  if (session.user.role !== "ADMIN") redirect("/");
  const { start: startOfToday, end: startOfTomorrow } = getBusinessDayRange();
  const [products, orders, logs, settings, sales, lowStock, codPending, codCollected] =
    await Promise.all([
      db.product.findMany({
        include: { variants: true, category: true },
        orderBy: { createdAt: "desc" },
      }),
      db.order.findMany({
        where: { createdAt: { gte: startOfToday, lt: startOfTomorrow } },
        include: {
          items: { include: { variant: { include: { product: true } } } },
        },
        orderBy: { createdAt: "desc" },
      }),
      db.inventoryLog.findMany({
        include: { variant: { include: { product: true } } },
        orderBy: { createdAt: "desc" },
        take: 12,
      }),
      getStoreSettings(),
      db.order.aggregate({
        where: { paymentStatus: "PAID" },
        _sum: { totalAmount: true },
        _count: true,
      }),
      db.productVariant.count({ where: { stockQuantity: { lte: 5 } } }),
      db.order.aggregate({
        where: {
          paymentMethod: "cod",
          paymentStatus: { in: ["UNPAID", "PENDING"] },
          status: { not: "CANCELLED" },
        },
        _sum: { totalAmount: true },
      }),
      db.order.aggregate({
        where: { paymentMethod: "cod", paymentStatus: "PAID" },
        _sum: { totalAmount: true },
      }),
    ]);
  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <p className="text-sm uppercase tracking-widest text-[#52745b]">Store management</p>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-4xl text-[#1b3b2b]">Dashboard</h1>
        <nav aria-label="Admin shortcuts" className="flex flex-wrap gap-2">
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-2 rounded-full border border-[#1b3b2b]/20 bg-white px-4 py-2.5 text-sm font-semibold text-[#1b3b2b] hover:bg-[#f2f6f1]"
          >
            <span className="grid size-7 place-items-center rounded-full bg-[#e3eee1] text-[#1b3b2b]">
              <ClipboardList size={14} />
            </span>
            Orders
          </Link>
          <Link
            href="/admin/catalog"
            className="inline-flex items-center gap-2 rounded-full border border-[#1b3b2b] bg-[#dce9db] px-4 py-2.5 text-sm font-semibold text-[#163823] shadow-sm transition hover:bg-[#c8dcc8]"
          >
            <span className="grid size-7 place-items-center rounded-full bg-[#1b3b2b] text-white">
              <PackagePlus size={15} />
            </span>
            Catalog studio
          </Link>
          <Link
            href="/admin/homepage"
            className="inline-flex items-center gap-2 rounded-full border border-[#1b3b2b]/20 bg-white px-4 py-2.5 text-sm font-semibold text-[#1b3b2b] hover:bg-[#f2f6f1]"
          >
            <span className="grid size-7 place-items-center rounded-full bg-[#e3eee1] text-[#1b3b2b]">
              <Home size={14} />
            </span>
            Homepage blocks
          </Link>
          <Link
            href="/admin/marketing"
            className="inline-flex items-center gap-2 rounded-full border border-[#1b3b2b]/20 bg-white px-4 py-2.5 text-sm font-semibold text-[#1b3b2b] hover:bg-[#f2f6f1]"
          >
            <span className="grid size-7 place-items-center rounded-full bg-[#e3eee1] text-[#1b3b2b]">
              <Tag size={14} />
            </span>
            Marketing
          </Link>
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-2 rounded-full border border-[#1b3b2b]/20 bg-white px-4 py-2.5 text-sm font-semibold text-[#1b3b2b] hover:bg-[#f2f6f1]"
          >
            <span className="grid size-7 place-items-center rounded-full bg-[#e3eee1] text-[#1b3b2b]">
              <UsersRound size={14} />
            </span>
            People
          </Link>
        </nav>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Metric
          label="Paid sales"
          value={`${settings.currency} ${Number(sales._sum.totalAmount ?? 0).toFixed(2)}`}
        />
        <Metric label="Paid orders" value={String(sales._count)} />
        <Metric label="Low stock variants" value={String(lowStock)} />
        <Metric
          label="COD pending"
          value={`${settings.currency} ${Number(codPending._sum.totalAmount ?? 0).toFixed(2)}`}
        />
        <Metric
          label="COD collected"
          value={`${settings.currency} ${Number(codCollected._sum.totalAmount ?? 0).toFixed(2)}`}
        />
      </div>
      <AdminPanel
        products={JSON.parse(JSON.stringify(products))}
        orders={JSON.parse(JSON.stringify(orders))}
        logs={JSON.parse(JSON.stringify(logs))}
        settings={settings}
      />
    </main>
  );
}
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-5">
      <p className="text-sm text-black/50">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}
