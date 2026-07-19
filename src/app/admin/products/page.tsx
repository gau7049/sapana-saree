import { Suspense } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { Package, Plus } from "lucide-react";
import { AdminProductsToolbar } from "@/components/admin/admin-products-toolbar";
import { AdminProductsList } from "@/components/admin/admin-products-list";
import { cn } from "@/lib/utils";
import { getAdminProducts } from "@/lib/queries/products";
import { getAllCategoriesAdmin } from "@/lib/queries/categories";
import type { ProductStatus } from "@/types";

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function AdminProductsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.page) || 1;

  const [{ products, total, totalPages }, categories] = await Promise.all([
    getAdminProducts({
      search: params.search,
      status: params.status as ProductStatus | undefined,
      category: params.category,
      sort: params.sort,
      page,
    }),
    getAllCategoriesAdmin(),
  ]);

  const hasActiveFilters = Boolean(
    params.search || params.status || params.category
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-sm text-muted-foreground">
            {total} {total === 1 ? "product" : "products"}
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className={cn(buttonVariants(), "gap-2")}
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Link>
      </div>

      <div className="mt-6">
        <Suspense>
          <AdminProductsToolbar categories={categories} />
        </Suspense>
      </div>

      {!products || products.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={Package}
            title={hasActiveFilters ? "No matching products" : "No products yet"}
            description={
              hasActiveFilters
                ? "Try adjusting your search or filters."
                : "Add your first product to get started."
            }
          >
            {!hasActiveFilters && (
              <Link href="/admin/products/new" className={buttonVariants()}>
                Add Product
              </Link>
            )}
          </EmptyState>
        </div>
      ) : (
        <>
          <AdminProductsList products={products} />

          <div className="mt-6">
            <Suspense>
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                basePath="/admin/products"
              />
            </Suspense>
          </div>
        </>
      )}
    </div>
  );
}
