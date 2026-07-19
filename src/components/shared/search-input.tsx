"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export function SearchInput({ defaultValue = "" }: { defaultValue?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Deliberately uncontrolled: Base UI's Input does not reliably surface
  // change events to React (its FieldControl half-controls the element), which
  // previously left the submit handler with an empty value while the user's
  // text sat in the DOM. Reading the live DOM value via FormData at submit
  // time works with any input implementation.
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const query = ((new FormData(e.currentTarget).get("q") as string) ?? "").trim();
    const params = new URLSearchParams(searchParams.toString());
    if (query) {
      params.set("q", query);
    } else {
      params.delete("q");
    }
    params.delete("page");
    router.push(`/search?${params.toString()}`);
  }

  return (
    // action="/search" + name="q" also keep native GET submission working if
    // the JS handler is ever bypassed.
    <form onSubmit={handleSubmit} action="/search" role="search" className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        name="q"
        placeholder="Search for sarees..."
        defaultValue={defaultValue}
        className="pl-10"
      />
      {/* Hidden submit button guarantees implicit Enter-to-submit across browsers. */}
      <button type="submit" className="sr-only">
        Search
      </button>
    </form>
  );
}
