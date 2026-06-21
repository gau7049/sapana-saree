import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { Package, Plus } from "lucide-react";
import { AdminProductActions } from "@/components/admin/product-actions";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  published: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  archived: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
};

export default async function AdminProductsPage() {
  const supabase = await createClient();

  const { data: products } = await supabase
    .from("products")
    .select("id, title, slug, price, status, is_featured, created_at, categories(name)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-sm text-muted-foreground">
            {products?.length ?? 0} products
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

      {!products || products.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={Package}
            title="No products yet"
            description="Add your first product to get started."
          >
            <Link href="/admin/products/new" className={buttonVariants()}>
              Add Product
            </Link>
          </EmptyState>
        </div>
      ) : (
        <div className="mt-6 space-y-2">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex items-center justify-between rounded-lg border bg-card p-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/products/${product.id}/edit`}
                    className="truncate font-medium hover:text-primary"
                  >
                    {product.title}
                  </Link>
                  <Badge
                    variant="secondary"
                    className={STATUS_STYLE[product.status] ?? ""}
                  >
                    {product.status}
                  </Badge>
                  {product.is_featured && (
                    <Badge variant="secondary">Featured</Badge>
                  )}
                </div>
                <div className="mt-0.5 flex items-center gap-3 text-sm text-muted-foreground">
                  <span>₹{Number(product.price).toLocaleString("en-IN")}</span>
                  {product.categories && (
                    <span>{(product.categories as unknown as { name: string }).name}</span>
                  )}
                  <span>
                    {new Date(product.created_at).toLocaleDateString("en-IN")}
                  </span>
                </div>
              </div>
              <AdminProductActions productId={product.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
