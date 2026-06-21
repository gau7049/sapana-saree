"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { NAV_LINKS, SITE_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";

export function MobileNav() {
  const pathname = usePathname();
  const { isMobileNavOpen, setMobileNavOpen } = useUIStore();

  return (
    <Sheet open={isMobileNavOpen} onOpenChange={setMobileNavOpen}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b p-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-bold">{SITE_NAME}</SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </SheetHeader>
        <nav className="flex flex-col p-4">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileNavOpen(false)}
              className={cn(
                "rounded-md px-3 py-3 text-sm font-medium transition-colors hover:bg-accent",
                pathname === link.href
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
