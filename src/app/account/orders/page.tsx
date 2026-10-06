import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
export default async function OrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/signin?callbackUrl=/account/orders");
  const orders = await db.order.findMany({
    where: { userId: session.user.id },
    include: {
      items: { include: { variant: { include: { product: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
  return (
    <main className="mx-auto max-w-5xl px-5 py-12 lg:px-8">
      <Link href="/account" className="text-xs text-[#718075]">
        ← Account
      </Link>
      <p className="mt-5 text-[10px] font-semibold uppercase tracking-[.2em] text-[#73917a]">
        Your purchases
      </p>
      <h1 className="mt-2 font-serif text-4xl text-[#1b3b2b]">Order history</h1>
      <div className="mt-8 space-y-4">
        {orders.map((o) => (
          <article
            key={o.id}
            className="rounded-2xl border border-[#1b3b2b]/10 bg-white p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-[#304536]">{o.orderNumber}</p>
                <p className="mt-1 text-xs text-[#859087]">
                  Placed {o.createdAt.toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <span className="rounded-full bg-[#eef4ed] px-3 py-1.5 text-[10px] font-medium text-[#4c6d53]">
                  {o.status.toLowerCase()}
                </span>
                <p className="mt-2 text-xs">
                  {o.paymentStatus.toLowerCase()} ·{" "}
                  {o.paymentMethod.replaceAll("_", " ")}
                </p>
              </div>
            </div>
            <div className="mt-4 border-t border-[#1b3b2b]/10 pt-3">
              {o.items.map((i) => (
                <div
                  key={i.id}
                  className="flex justify-between gap-4 py-1.5 text-xs"
                >
                  <span className="text-[#6f7e72]">
                    {i.variant.product.title} × {i.quantity}
                  </span>
                  <span>{Number(i.price).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 border-t border-[#1b3b2b]/10 pt-3 text-right text-sm font-semibold text-[#1b3b2b]">
              Total {Number(o.totalAmount).toFixed(2)}
            </p>
          </article>
        ))}
        {!orders.length && (
          <div className="rounded-2xl border border-dashed border-[#1b3b2b]/20 p-10 text-center text-sm text-[#78857a]">
            No orders yet.{" "}
            <Link href="/#shop" className="underline">
              Find something you love.
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
