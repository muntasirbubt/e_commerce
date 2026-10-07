import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProfileForm } from "@/components/profile-form";
import { ArrowRight, PackageCheck } from "lucide-react";
export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/signin?callbackUrl=/account");
  const [user, orders] = await Promise.all([
    db.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, createdAt: true },
    }),
    db.order.findMany({
      where: { userId: session.user.id },
      include: {
        items: { include: { variant: { include: { product: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
  ]);
  return (
    <main className="mx-auto max-w-6xl px-5 py-12 lg:px-8">
      <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#73917a]">
        Your account
      </p>
      <h1 className="mt-2 font-serif text-4xl text-[#1b3b2b]">
        Good to see you, {user?.name || "there"}.
      </h1>
      <p className="mt-2 text-sm text-[#748176]">{user?.email}</p>
      <div className="mt-8 grid gap-7 md:grid-cols-[.8fr_1.2fr]">
        <div className="space-y-4">
          <ProfileForm name={user?.name ?? ""} />
          <div className="rounded-2xl bg-[#1b3b2b] p-5 text-white">
            <PackageCheck size={19} className="text-[#afc9ae]" />
            <h2 className="mt-4 font-serif text-xl">Orders, in good hands.</h2>
            <p className="mt-2 text-xs leading-5 text-white/65">
              Look back at every order you’ve placed with us.
            </p>
            <Link
              href="/account/orders"
              className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-[#d8e7d5]"
            >
              View order history <ArrowRight size={14} />
            </Link>
          </div>
        </div>
        <section>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#73917a]">
                Your purchases
              </p>
              <h2 className="mt-1 font-serif text-2xl text-[#1b3b2b]">
                Recent orders
              </h2>
            </div>
            <Link href="/account/orders" className="text-xs text-[#4e6d54]">
              View all →
            </Link>
          </div>
          {orders.length ? (
            <div className="space-y-3">
              {orders.map((o) => (
                <article
                  key={o.id}
                  className="rounded-2xl border border-[#1b3b2b]/10 bg-white p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-[#304536]">
                        {o.orderNumber}
                      </p>
                      <p className="mt-1 text-[10px] text-[#89948b]">
                        {o.createdAt.toLocaleDateString()} ·{" "}
                        {o.items.reduce((n, i) => n + i.quantity, 0)} item(s)
                      </p>
                    </div>
                    <span className="rounded-full bg-[#eef4ed] px-3 py-1.5 text-[10px] font-medium text-[#4c6d53]">
                      {o.status.toLowerCase()}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-[#1b3b2b]/10 pt-3 text-xs">
                    <span className="text-[#78857a]">
                      {o.items.map((i) => i.variant.product.title).join(", ")}
                    </span>
                    <span className="font-medium text-[#1b3b2b]">
                      {Number(o.totalAmount).toFixed(2)}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#1b3b2b]/20 bg-white p-9 text-center">
              <p className="font-serif text-xl text-[#1b3b2b]">
                Your first order will be a good one.
              </p>
              <Link
                href="/shop"
                className="mt-3 inline-flex items-center gap-2 text-xs text-[#4e6d54]"
              >
                Explore the shop <ArrowRight size={13} />
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
