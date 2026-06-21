"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, Heart, User, LogOut } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "./theme-toggle";
import { MobileNav } from "./mobile-nav";
import { useAuth } from "@/hooks/use-auth";
import { signOut } from "@/actions/auth";
import { NAV_LINKS, SITE_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";

export function Header() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const { setMobileNavOpen } = useUIStore();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight">
              {SITE_NAME}
            </span>
          </Link>
        </div>

        <nav className="hidden lg:flex lg:items-center lg:gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-3 py-2 text-sm font-medium rounded-md transition-colors hover:text-primary",
                pathname === link.href
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <Link
            href="/search"
            className={buttonVariants({ variant: "ghost", size: "icon" })}
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </Link>

          {!loading && user && (
            <Link
              href="/wishlist"
              className={buttonVariants({ variant: "ghost", size: "icon" })}
              aria-label="Wishlist"
            >
              <Heart className="h-5 w-5" />
            </Link>
          )}

          <ThemeToggle />

          {loading ? (
            <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="icon" aria-label="Account menu" />
                }
              >
                <User className="h-5 w-5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem render={<Link href="/account" />}>
                  My Account
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/account/inquiries" />}>
                  My Inquiries
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/account/reviews" />}>
                  My Reviews
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut()}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              href="/login"
              className={buttonVariants({ variant: "default", size: "sm" })}
            >
              Sign In
            </Link>
          )}
        </div>
      </div>

      <MobileNav />
    </header>
  );
}
