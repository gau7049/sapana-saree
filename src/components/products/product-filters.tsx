"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { Category } from "@/types";

export function ProductFilters({
  categories,
  materials,
  occasions,
}: {
  categories?: Category[];
  materials: string[];
  occasions: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlMinPrice = searchParams.get("minPrice") ?? "";
  const urlMaxPrice = searchParams.get("maxPrice") ?? "";
  const [minPrice, setMinPrice] = useState(urlMinPrice);
  const [maxPrice, setMaxPrice] = useState(urlMaxPrice);
  const [prevUrlPrices, setPrevUrlPrices] = useState({
    min: urlMinPrice,
    max: urlMaxPrice,
  });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Re-sync the inputs when the URL changes from outside them (Clear button,
  // back/forward navigation) — they were previously uncontrolled and kept
  // showing stale values. Render-time state adjustment per React's
  // "adjusting state when props change" pattern.
  if (prevUrlPrices.min !== urlMinPrice || prevUrlPrices.max !== urlMaxPrice) {
    setPrevUrlPrices({ min: urlMinPrice, max: urlMaxPrice });
    setMinPrice(urlMinPrice);
    setMaxPrice(urlMaxPrice);
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const updateFilter = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  function handlePriceChange(key: "minPrice" | "maxPrice", value: string) {
    if (key === "minPrice") setMinPrice(value);
    else setMaxPrice(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(
      () => updateFilter(key, value || null),
      400
    );
  }

  const clearFilters = useCallback(() => {
    setMinPrice("");
    setMaxPrice("");
    router.push(pathname);
  }, [router, pathname]);

  const hasFilters =
    searchParams.has("category") ||
    searchParams.has("minPrice") ||
    searchParams.has("maxPrice") ||
    searchParams.has("material") ||
    searchParams.has("occasion");

  return (
    <div className="space-y-4 border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Filters</h3>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-1 h-3 w-3" />
            Clear Filters
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {categories && categories.length > 0 && (
          <div>
            <Label className="text-xs text-muted-foreground">Category</Label>
            <Select
              value={searchParams.get("category") ?? ""}
              onValueChange={(v) => updateFilter("category", v || null)}
              items={categories.map((c) => ({ value: c.slug, label: c.name }))}
            >
              <SelectTrigger className="mt-1 h-8 w-full">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.slug}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <Label className="text-xs text-muted-foreground">Price Range</Label>
          <div className="mt-1 flex gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={minPrice}
              onValueChange={(v) => handlePriceChange("minPrice", v)}
              className="h-8"
            />
            <Input
              type="number"
              placeholder="Max"
              value={maxPrice}
              onValueChange={(v) => handlePriceChange("maxPrice", v)}
              className="h-8"
            />
          </div>
        </div>

        {materials.length > 0 && (
          <div>
            <Label className="text-xs text-muted-foreground">Material</Label>
            <Select
              value={searchParams.get("material") ?? ""}
              onValueChange={(v) => updateFilter("material", v || null)}
              items={materials.map((m) => ({ value: m, label: m }))}
            >
              <SelectTrigger className="mt-1 h-8 w-full">
                <SelectValue placeholder="All materials" />
              </SelectTrigger>
              <SelectContent>
                {materials.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {occasions.length > 0 && (
          <div>
            <Label className="text-xs text-muted-foreground">Occasion</Label>
            <Select
              value={searchParams.get("occasion") ?? ""}
              onValueChange={(v) => updateFilter("occasion", v || null)}
              items={occasions.map((o) => ({ value: o, label: o }))}
            >
              <SelectTrigger className="mt-1 h-8 w-full">
                <SelectValue placeholder="All occasions" />
              </SelectTrigger>
              <SelectContent>
                {occasions.map((o) => (
                  <SelectItem key={o} value={o}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
}
