import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getStoreSettings } from "@/lib/config";
import type { Prisma } from "@prisma/client";

const PAGE_SIZE = 50;

type SearchParams = Promise<{
  q?: string;
  group?: string;
  page?: string;
}>;

export default async function AllOrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/signin?callbackUrl=/admin/orders");
  if (session.user.role !== "ADMIN") redirect("/");

  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const groupByDate = params.group === "date";
  const page = Math.max(1, Number(params.page) || 1);
  const where: Prisma.OrderWhereInput = query
    ? {
        OR: [
          { orderNumber: { contains: query, mode: "insensitive" } },
          { customerName: { contains: query, mode: "insensitive" } },
          { customerEmail: { contains: query, mode: "insensitive" } },
          {
            items: {
              some: {
                variant: {
                  product: { title: { contains: query, mode: "insensitive" } },
                },
              },
            },
          },
        ],
      }
    : {};

  const [orders, total, settings] = await Promise.all([
    db.order.findMany({
      where,
      include: {
        items: {
          include: {
            variant: { include: { product: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.order.count({ where }),
    getStoreSettings(),
  ]);

  const timeZone = process.env.STORE_TIMEZONE || "Asia/Dhaka";
  const dateFormatter = new Intl.DateTimeFormat("en", {
    timeZone,
    dateStyle: "full",
  });
  const groupedOrders = groupByDate
    ? orders.reduce<Record<string, typeof orders>>((groups, order) => {
        const date = dateFormatter.format(order.createdAt);
        groups[date] ??= [];
        groups[date].push(order);
        return groups;
      }, {})
    : null;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageHref = (nextPage: number) =>
    `/admin/orders?${new URLSearchParams({
      ...(query ? { q: query } : {}),
      ...(groupByDate ? { group: "date" } : {}),
      page: String(nextPage),
    }).toString()}`;

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
      <Link
        href="/admin"
        className="text-sm font-medium text-[#315a3b] underline underline-offset-4"
      >
        ← Back to dashboard
      </Link>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#52745b]">
            Order management
          </p>
          <h1 className="mt-1 font-serif text-4xl text-[#1b3b2b]">All orders</h1>
          <p className="mt-2 text-sm text-[#56645a]">
            Search order numbers, customer names, email addresses, or products.
          </p>
        </div>
        <p className="text-sm text-[#56645a]">
          {total} order{total === 1 ? "" : "s"} total
        </p>
      </div>

      <form
        action="/admin/orders"
        className="mt-7 grid gap-3 rounded-2xl border border-[#1b3b2b]/10 bg-white p-4 sm:grid-cols-[1fr_220px_auto] sm:items-end"
      >
        <label className="text-xs font-semibold text-[#34473b]">
          Search orders
          <input
            name="q"
            defaultValue={query}
            placeholder="Order number, customer, or product"
            className="mt-1.5 block w-full rounded-xl border border-[#1b3b2b]/15 px-3 py-2.5 text-sm font-normal text-[#212529] placeholder:text-[#66736a]"
          />
        </label>
        <label className="text-xs font-semibold text-[#34473b]">
          Group results
          <select
            name="group"
            defaultValue={groupByDate ? "date" : "none"}
            className="mt-1.5 block w-full rounded-xl border border-[#1b3b2b]/15 bg-white px-3 py-2.5 text-sm font-normal text-[#34473b]"
          >
            <option value="none">No grouping</option>
            <option value="date">Group by order date</option>
          </select>
        </label>
        <button className="rounded-full bg-[#1b3b2b] px-5 py-3 text-sm font-semibold text-white">
          Apply
        </button>
      </form>

      <section className="mt-6 space-y-4">
        {groupByDate && groupedOrders
          ? Object.entries(groupedOrders).map(([date, dateOrders]) => (
              <OrderGroup
                key={date}
                title={date}
                orders={dateOrders ?? []}
                currency={settings.currency}
                timeZone={timeZone}
              />
            ))
          : orders.length > 0 && (
              <OrderGroup
                title="Recent orders"
                orders={orders}
                currency={settings.currency}
                timeZone={timeZone}
              />
            )}
        {!orders.length && (
          <div className="rounded-2xl border border-dashed border-[#1b3b2b]/20 bg-white p-10 text-center">
            <h2 className="font-serif text-2xl text-[#1b3b2b]">No matching orders</h2>
            <p className="mt-2 text-sm text-[#56645a]">
              Try another customer name, order number, or product name.
            </p>
          </div>
        )}
      </section>

      {pageCount > 1 && (
        <nav aria-label="Order pages" className="mt-8 flex items-center justify-center gap-4">
          <Link
            aria-disabled={page <= 1}
            href={pageHref(Math.max(1, page - 1))}
            className="rounded-full border border-[#1b3b2b]/15 px-4 py-2 text-sm font-medium text-[#34473b]"
          >
            Previous
          </Link>
          <span className="text-sm text-[#56645a]">
            Page {page} of {pageCount}
          </span>
          <Link
            aria-disabled={page >= pageCount}
            href={pageHref(Math.min(pageCount, page + 1))}
            className="rounded-full border border-[#1b3b2b]/15 px-4 py-2 text-sm font-medium text-[#34473b]"
          >
            Next
          </Link>
        </nav>
      )}
    </main>
  );
}

type OrderWithItems = Prisma.OrderGetPayload<{
  include: {
    items: { include: { variant: { include: { product: true } } } };
  };
}>;

function OrderGroup({
  title,
  orders,
  currency,
  timeZone,
}: {
  title: string;
  orders: OrderWithItems[];
  currency: string;
  timeZone: string;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#1b3b2b]/10 bg-white">
      <h2 className="border-b border-[#1b3b2b]/10 bg-[#f4f7f2] px-5 py-3 text-sm font-semibold text-[#263a2c]">
        {title}
      </h2>
      <div className="divide-y divide-[#1b3b2b]/10">
        {orders.map((order) => (
          <article
            key={order.id}
            className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_1fr_auto_auto] md:items-center"
          >
            <div>
              <p className="font-semibold text-[#1b3b2b]">{order.orderNumber}</p>
              <p className="mt-1 text-sm text-[#34473b]">{order.customerName}</p>
              <p className="text-xs text-[#56645a]">{order.customerEmail}</p>
            </div>
            <div className="text-sm text-[#34473b]">
              {order.items.map((item) => (
                <p key={item.id}>
                  {item.variant.product.title} × {item.quantity}
                </p>
              ))}
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1b3b2b]">
                {currency} {Number(order.totalAmount).toFixed(2)}
              </p>
              <p className="mt-1 text-xs text-[#56645a]">
                {order.status} · {order.paymentStatus}
              </p>
            </div>
            <time dateTime={order.createdAt.toISOString()} className="text-xs text-[#56645a]">
              {new Intl.DateTimeFormat("en", {
                timeZone,
                dateStyle: "medium",
                timeStyle: "short",
              }).format(order.createdAt)}
            </time>
          </article>
        ))}
      </div>
    </section>
  );
}
