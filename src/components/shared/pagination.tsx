"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({
  currentPage,
  totalPages,
  basePath,
}: {
  currentPage: number;
  totalPages: number;
  basePath: string;
}) {
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  function buildUrl(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    return `${basePath}?${params.toString()}`;
  }

  // Windowed page list: show every page up to 7; beyond that, always show
  // first/last plus a sliding window around the current page, with "..."
  // filling the gaps — keeps the control from growing unbounded wide.
  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("...");
    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i++
    ) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <nav className="flex items-center justify-center gap-1" aria-label="Pagination">
      {currentPage > 1 && (
        <Link
          href={buildUrl(currentPage - 1)}
          className={buttonVariants({ variant: "ghost", size: "icon" })}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
      )}

      {pages.map((page, i) =>
        page === "..." ? (
          <span key={`dots-${i}`} className="px-2 text-muted-foreground">
            ...
          </span>
        ) : (
          <Link
            key={page}
            href={buildUrl(page)}
            className={cn(
              buttonVariants({
                variant: page === currentPage ? "default" : "ghost",
                size: "icon",
              })
            )}
            aria-current={page === currentPage ? "page" : undefined}
          >
            {page}
          </Link>
        )
      )}

      {currentPage < totalPages && (
        <Link
          href={buildUrl(currentPage + 1)}
          className={buttonVariants({ variant: "ghost", size: "icon" })}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </nav>
  );
}
