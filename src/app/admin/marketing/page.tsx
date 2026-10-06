import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { CouponManager } from "@/components/coupon-manager";
export default async function MarketingPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/signin?callbackUrl=/admin/marketing");
  if (session.user.role !== "ADMIN") redirect("/");
  const coupons = await db.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
      <Link href="/admin" className="text-xs text-[#718075]">
        ← Dashboard
      </Link>
      <p className="mt-5 text-[10px] font-semibold uppercase tracking-[.2em] text-[#73917a]">
        Campaigns
      </p>
      <h1 className="mt-1 font-serif text-4xl text-[#1b3b2b]">
        A little extra, now and then.
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#748176]">
        Create checkout codes, schedule offers, and set redemption limits.
      </p>
      <CouponManager initial={JSON.parse(JSON.stringify(coupons))} />
    </main>
  );
}
