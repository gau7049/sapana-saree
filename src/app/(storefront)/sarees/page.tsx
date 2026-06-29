import { Suspense } from "react";
import { createMetadata } from "@/lib/seo";
import { getProducts, getProductFilterOptions } from "@/lib/queries/products";
import { ProductGrid } from "@/components/products/product-grid";
import { ProductFilters } from "@/components/products/product-filters";
import { ProductSort } from "@/components/products/product-sort";
import { Pagination } from "@/components/shared/pagination";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export const revalidate = 3600;

export const metadata = createMetadata({
  title: "All Sarees",
  description:
    "Browse our complete collection of sarees — silk, cotton, designer, wedding, and more.",
  path: "/sarees",
});

export default async function SareesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;

  const [{ products, total, totalPages }, filterOptions] = await Promise.all([
    getProducts({
      category: params.category,
      minPrice: params.minPrice ? Number(params.minPrice) : undefined,
      maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
      material: params.material,
      occasion: params.occasion,
      sort: params.sort,
      featured: params.featured === "true",
      search: params.search,
      page,
    }),
    getProductFilterOptions(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>All Sarees</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            All Sarees
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} {total === 1 ? "product" : "products"} found
          </p>
        </div>
        <Suspense>
          <ProductSort />
        </Suspense>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block">
          <Suspense>
            <ProductFilters
              materials={filterOptions.materials}
              occasions={filterOptions.occasions}
            />
          </Suspense>
        </aside>

        <div className="space-y-8">
          <ProductGrid products={products} />
          <Suspense>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              basePath="/sarees"
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
