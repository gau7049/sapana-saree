import { Suspense } from "react";
import { createMetadata } from "@/lib/seo";
import { getProducts } from "@/lib/queries/products";
import { ProductGrid } from "@/components/products/product-grid";
import { Pagination } from "@/components/shared/pagination";
import { SearchInput } from "@/components/shared/search-input";

export const metadata = createMetadata({
  title: "Search",
  description: "Search our collection of sarees",
  path: "/search",
});

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const query = params.q ?? "";
  const page = Number(params.page) || 1;

  const { products, total, totalPages } = query
    ? await getProducts({ search: query, sort: params.sort, page })
    : { products: [], total: 0, totalPages: 0 };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Search</h1>

      <div className="mt-4 max-w-xl">
        <Suspense>
          <SearchInput defaultValue={query} />
        </Suspense>
      </div>

      {query && (
        <p className="mt-4 text-sm text-muted-foreground">
          {total} {total === 1 ? "result" : "results"} for &quot;{query}&quot;
        </p>
      )}

      <div className="mt-8 space-y-8">
        <ProductGrid products={products} />
        {totalPages > 1 && (
          <Suspense>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              basePath="/search"
            />
          </Suspense>
        )}
      </div>
    </div>
  );
}
