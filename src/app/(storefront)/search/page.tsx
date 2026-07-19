import { Suspense } from "react";
import Link from "next/link";
import { Search as SearchIcon } from "lucide-react";
import { createMetadata } from "@/lib/seo";
import { getProducts } from "@/lib/queries/products";
import { getCategories } from "@/lib/queries/categories";
import { ProductGrid } from "@/components/products/product-grid";
import { EmptyState } from "@/components/shared/empty-state";
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
        {!query ? (
          <SearchLanding />
        ) : products.length === 0 ? (
          <EmptyState
            icon={SearchIcon}
            title={`No results for "${query}"`}
            description="Check the spelling or try a different term — for example a fabric (silk, cotton) or an occasion (bridal, casual)."
            actionLabel="Browse All Sarees"
            actionHref="/sarees"
          />
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}

/** Shown before any query: a starting point instead of a false "no results". */
async function SearchLanding() {
  const categories = await getCategories();

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Search by name, fabric, color, or occasion — or start from a category:
      </p>
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/categories/${category.slug}`}
            className="rounded-full border bg-card px-4 py-1.5 text-sm transition-colors hover:border-primary/40 hover:text-primary"
          >
            {category.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
