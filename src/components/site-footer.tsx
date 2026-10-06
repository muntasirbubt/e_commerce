import Link from "next/link";
import { Leaf, ArrowUpRight } from "lucide-react";
export function SiteFooter({ storeName }: { storeName: string }) {
  return (
    <footer className="mt-24 bg-[#1b3b2b] text-[#eef4ed]">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-14 md:grid-cols-[1.5fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-semibold"
          >
            <Leaf size={19} />
            {storeName}
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-6 text-white/80">
            Considered goods for a more intentional everyday. Made to be used,
            loved, and kept.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold">Explore</h2>
          <div className="mt-4 grid gap-3 text-sm text-white/80">
            <Link href="/#shop">Shop all</Link>
            <Link href="/#offers">Special offers</Link>
            <Link href="/#upcoming">Coming soon</Link>
          </div>
        </div>
        <div>
          <h2 className="text-sm font-semibold">The company</h2>
          <div className="mt-4 grid gap-3 text-sm text-white/80">
            <Link href="/about">Our story</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/faq">FAQs</Link>
          </div>
        </div>
        <div>
          <h2 className="text-sm font-semibold">The details</h2>
          <div className="mt-4 grid gap-3 text-sm text-white/80">
            <Link href="/policies/terms">Terms of service</Link>
            <Link href="/policies/privacy">Privacy policy</Link>
            <Link href="/policies/returns">Returns & refunds</Link>
            <Link href="/policies/shipping">Shipping policy</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-white/15">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 px-5 py-5 text-xs text-white/75 sm:flex-row lg:px-8">
          <span>
            © {new Date().getFullYear()} {storeName}. All rights reserved.
          </span>
          <Link href="/contact" className="inline-flex items-center gap-1">
            Questions? Get in touch <ArrowUpRight size={13} />
          </Link>
        </div>
      </div>
    </footer>
  );
}
