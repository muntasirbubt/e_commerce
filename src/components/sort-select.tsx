"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/** Sort dropdown that updates `?sort=` and resets pagination, keeping other filters. */
export function SortSelect({ value, options }: { value: string; options: { value: string; label: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return (
    <label className="flex items-center gap-2 text-xs text-[#56645a]">
      Sort by
      <select
        id="shop-sort"
        value={value}
        onChange={(e) => {
          const next = new URLSearchParams(searchParams.toString());
          if (e.target.value === "newest") next.delete("sort");
          else next.set("sort", e.target.value);
          next.delete("page");
          const qs = next.toString();
          router.push(`${pathname}${qs ? `?${qs}` : ""}`);
        }}
        className="rounded-full border border-[#1b3b2b]/15 bg-white px-3 py-2 text-xs text-[#34473b] outline-none focus:border-[#84a98c]"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
