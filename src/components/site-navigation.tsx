"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { label: "Shop", href: "/#shop", id: "shop" },
  { label: "Offers", href: "/#offers", id: "offers" },
  { label: "Coming soon", href: "/#upcoming", id: "upcoming" },
  { label: "Our story", href: "/about", id: "/about" },
  { label: "Contact", href: "/contact", id: "/contact" },
];

export function SiteNavigation() {
  const pathname = usePathname();
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    if (pathname !== "/") {
      setActiveSection(pathname);
      return;
    }

    const updateActiveSection = () => {
      const visibleSections = links
        .filter((link) => ["shop", "offers", "upcoming"].includes(link.id))
        .map((link) => document.getElementById(link.id))
        .filter((section): section is HTMLElement => section !== null)
        .filter((section) => section.getBoundingClientRect().top <= 170);

      const current = visibleSections.at(-1);
      const hashSection = window.location.hash.slice(1);
      setActiveSection(current?.id ?? hashSection);
    };

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("hashchange", updateActiveSection);

    return () => {
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("hashchange", updateActiveSection);
    };
  }, [pathname]);

  return (
    <nav
      aria-label="Main navigation"
      className="hidden items-center gap-6 text-base text-[#34473b] xl:flex xl:gap-7"
    >
      {links.map((link) => {
        const active = activeSection === link.id;

        return (
          <Link
            key={link.id}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`relative py-2 transition-colors after:absolute after:inset-x-0 after:-bottom-1 after:h-0.5 after:rounded-full after:bg-[#1b3b2b] after:transition-transform ${
              active
                ? "font-bold text-[#1b3b2b] after:scale-x-100"
                : "font-medium text-[#34473b] after:scale-x-0 hover:text-[#1b3b2b] hover:after:scale-x-100"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
