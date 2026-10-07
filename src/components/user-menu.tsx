"use client";

import Link from "next/link";
import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { signOut } from "next-auth/react";

export function UserMenu({ name }: { name: string }) {
  const initial = name.trim().slice(0, 1).toUpperCase() || "U";
  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-[#1b3b2b]/15 bg-white/90 py-1.5 pl-1.5 pr-3 text-sm font-semibold text-[#1b3b2b] shadow-sm transition hover:bg-[#e9f0e9] [&::-webkit-details-marker]:hidden">
        <span className="grid size-8 place-items-center rounded-full bg-[#1b3b2b] text-xs font-semibold text-white">
          {initial}
        </span>
        <span className="hidden max-w-28 truncate sm:inline">{name || "My account"}</span>
        <ChevronDown size={14} className="transition group-open:rotate-180" />
      </summary>
      <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-2xl border border-[#1b3b2b]/10 bg-white p-2 shadow-xl shadow-[#1b3b2b]/10">
        <Link
          href="/account"
          className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-[#34473b] transition hover:bg-[#f0f5ef]"
        >
          <UserRound size={15} /> Profile
        </Link>
        <button
          type="button"
          onClick={() => void signOut({ callbackUrl: "/" })}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[#34473b] transition hover:bg-[#f0f5ef]"
        >
          <LogOut size={15} /> Logout
        </button>
      </div>
    </details>
  );
}
