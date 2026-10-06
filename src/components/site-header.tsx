import Link from "next/link";
import { ArrowUpRight, LayoutDashboard, Leaf, ShoppingBag, UserRound } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SiteNavigation } from "@/components/site-navigation";

export async function SiteHeader({ storeName }: { storeName: string }) {
  const session = await getServerSession(authOptions);

  return (
    <header className="sticky top-0 z-40 border-b border-[#183c2d]/10 bg-[#f8f9f5]/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold tracking-tight text-[#1b3b2b]"
        >
          <span className="grid size-9 place-items-center rounded-full bg-[#1b3b2b] text-[#e5f2e6]">
            <Leaf size={17} />
          </span>
          {storeName}
        </Link>

        <div className="xl:flex">
          <SiteNavigation />
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={session?.user ? "/account" : "/signin"}
            className="hidden items-center gap-2 rounded-full border border-[#1b3b2b]/15 bg-white/80 px-3 py-2 text-sm font-semibold text-[#1b3b2b] shadow-sm transition hover:bg-[#e9f0e9] sm:inline-flex"
          >
            <span className="grid size-7 place-items-center rounded-full bg-[#e3eee1] text-[#1b3b2b]">
              <UserRound size={15} />
            </span>
            {session?.user?.name ?? (session?.user ? "My account" : "Sign in")}
          </Link>
          {session?.user?.role === "ADMIN" && (
            <Link
              href="/admin"
              style={{ backgroundColor: "#1b3b2b", color: "#ffffff" }}
              className="hidden items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold shadow-sm transition hover:brightness-110 lg:inline-flex"
            >
              <LayoutDashboard size={16} style={{ color: "#ffffff" }} />
              Dashboard
            </Link>
          )}
          <Link
            href="/checkout"
            aria-label="Shopping bag"
            style={{ backgroundColor: "#1b3b2b", color: "#ffffff" }}
            className="relative grid size-10 place-items-center rounded-full transition hover:brightness-110"
          >
            <ShoppingBag size={17} style={{ color: "#ffffff", stroke: "#ffffff" }} />
          </Link>
          <Link
            href="/signin"
            className="grid size-10 place-items-center rounded-full border border-[#1b3b2b]/15 text-[#1b3b2b] sm:hidden"
            aria-label="Sign in"
          >
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>
    </header>
  );
}
