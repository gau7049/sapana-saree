"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ProductFilters } from "./product-filters";
import type { Category } from "@/types";

const FILTER_KEYS = [
  "category",
  "minPrice",
  "maxPrice",
  "material",
  "occasion",
] as const;

/**
 * Mobile/tablet entry point for ProductFilters — the sidebar is hidden below
 * `lg`, which previously left small screens with no way to filter at all.
 */
export function ProductFiltersDrawer({
  categories,
  materials,
  occasions,
}: {
  categories?: Category[];
  materials: string[];
  occasions: string[];
}) {
  const [open, setOpen] = useState(false);
  const searchParams = useSearchParams();
  const activeCount = FILTER_KEYS.filter((key) => searchParams.has(key)).length;

  return (
    <div className="lg:hidden">
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => setOpen(true)}
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filters
        {activeCount > 0 && (
          <Badge
            variant="secondary"
            className="h-5 min-w-5 justify-center rounded-full px-1 text-xs"
          >
            {activeCount}
          </Badge>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Filter Sarees</DialogTitle>
          </DialogHeader>
          <ProductFilters
            categories={categories}
            materials={materials}
            occasions={occasions}
          />
          <Button className="w-full" onClick={() => setOpen(false)}>
            Show results
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
