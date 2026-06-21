"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
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

export function ProductFilters({
  materials,
  occasions,
}: {
  materials: string[];
  occasions: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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

  const clearFilters = useCallback(() => {
    router.push(pathname);
  }, [router, pathname]);

  const hasFilters =
    searchParams.has("minPrice") ||
    searchParams.has("maxPrice") ||
    searchParams.has("material") ||
    searchParams.has("occasion");

  return (
    <div className="space-y-4 rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Filters</h3>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-1 h-3 w-3" />
            Clear
          </Button>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <Label className="text-xs text-muted-foreground">Price Range</Label>
          <div className="mt-1 flex gap-2">
            <Input
              type="number"
              placeholder="Min"
              defaultValue={searchParams.get("minPrice") ?? ""}
              onChange={(e) => updateFilter("minPrice", e.target.value || null)}
              className="h-8"
            />
            <Input
              type="number"
              placeholder="Max"
              defaultValue={searchParams.get("maxPrice") ?? ""}
              onChange={(e) => updateFilter("maxPrice", e.target.value || null)}
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
            >
              <SelectTrigger className="mt-1 h-8">
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
            >
              <SelectTrigger className="mt-1 h-8">
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
