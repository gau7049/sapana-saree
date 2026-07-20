"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Overview", href: "/account" },
  { label: "Address", href: "/account/address" },
  { label: "Inquiries", href: "/account/inquiries" },
  { label: "Reviews", href: "/account/reviews" },
];

export function AccountTabs() {
  const pathname = usePathname();

  return (
    <nav className="mt-6 flex gap-1 overflow-x-auto border-b">
      {TABS.map((tab) => {
        // Overview is "/account" itself, so it needs an exact match — every
        // other tab's href is otherwise a prefix of no other tab's href.
        const isActive =
          tab.href === "/account" ? pathname === tab.href : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-primary"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
