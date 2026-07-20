"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, Heart, User, LogOut, LayoutDashboard } from "lucide-react";
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
import { useAuthStore } from "@/stores/auth-store";
import { signOut } from "@/actions/auth";
import { NAV_LINKS, SITE_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";

// Circular, thin-bordered icon buttons — the wireframe renders every header
// icon as an outlined circle rather than the app's previous borderless ghost
// icons.
const ICON_BUTTON = "rounded-full border border-border";

// Condensed nav shown at the tablet breakpoint (the wireframe's tablet header
// shows only "Shop" + "Categories" inline); the full NAV_LINKS list still
// appears at desktop, and the hamburger drawer keeps every link reachable at
// every size so nothing becomes unreachable.
const TABLET_NAV_HREFS = ["/sarees", "/categories"];

export function Header() {
  const pathname = usePathname();
  const { user, loading, isAdmin } = useAuth();
  const { setMobileNavOpen } = useUIStore();

  const tabletLinks = NAV_LINKS.filter((link) =>
    TABLET_NAV_HREFS.includes(link.href)
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:h-16 sm:gap-4 sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 lg:hidden"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <Link
          href="/"
          className="flex flex-1 shrink-0 items-center justify-center gap-2 sm:flex-none sm:justify-start"
        >
          <span className="text-lg font-bold tracking-tight sm:text-xl">
            {SITE_NAME}
          </span>
        </Link>

        <nav className="hidden lg:flex lg:items-center lg:gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-3 py-2 text-sm font-medium transition-colors hover:text-foreground",
                pathname === link.href
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <nav className="hidden items-center gap-4 sm:flex lg:hidden">
          {tabletLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium whitespace-nowrap transition-colors hover:text-foreground",
                pathname === link.href
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden flex-1 sm:block lg:max-w-md">
          <Link
            href="/search"
            className="flex h-9 w-full items-center gap-2 border border-border bg-background px-3 text-sm text-muted-foreground transition-colors hover:border-foreground/30 sm:h-10"
          >
            <Search className="h-4 w-4 shrink-0" />
            <span>Search sarees, categories...</span>
          </Link>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Link
            href="/search"
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }), ICON_BUTTON, "sm:hidden")}
            aria-label="Search"
          >
            <Search className="h-4.5 w-4.5" />
          </Link>

          {!loading && user && (
            <Link
              href="/wishlist"
              data-tour="wishlist"
              className={cn(buttonVariants({ variant: "ghost", size: "icon" }), ICON_BUTTON, "inline-flex")}
              aria-label="Wishlist"
            >
              <Heart className="h-4.5 w-4.5" />
            </Link>
          )}

          <ThemeToggle className={ICON_BUTTON} />

          {loading ? (
            <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Account menu"
                    data-tour="account-menu"
                    className={ICON_BUTTON}
                  />
                }
              >
                <User className="h-4.5 w-4.5" />
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
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem render={<Link href="/admin" />}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Admin Panel
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    // Clear shared auth state immediately so the header doesn't
                    // keep showing the account menu during the redirect.
                    useAuthStore.getState().clear();
                    signOut();
                  }}
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
