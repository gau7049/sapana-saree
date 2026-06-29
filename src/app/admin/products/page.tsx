import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { Package, Plus } from "lucide-react";
import { AdminProductActions } from "@/components/admin/product-actions";
import { cn } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/supabase/helpers";
import { MOCK_PRODUCTS } from "@/lib/mock-data";

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  published: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  archived: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
};

async function getAdminProducts() {
  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { data } = await supabase
        .from("products")
        .select(
          "id, title, slug, price, status, is_featured, created_at, categories(name)"
        )
        .order("created_at", { ascending: false });
      if (data) return { products: data, isDemo: false };
    } catch {}
  }

  return {
    products: MOCK_PRODUCTS.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      price: p.price,
      status: p.status,
      is_featured: p.is_featured,
      created_at: p.created_at,
      categories: p.categories ? { name: p.categories.name } : null,
    })),
    isDemo: true,
  };
}

export default async function AdminProductsPage() {
  const { products, isDemo } = await getAdminProducts();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-sm text-muted-foreground">
            {products?.length ?? 0} products
            {isDemo && " (demo data)"}
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

      {isDemo && (
        <div className="mt-4 rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-800 dark:border-yellow-700 dark:bg-yellow-950 dark:text-yellow-200">
          <strong>Demo Mode:</strong> Showing mock data. Connect Supabase to
          add real products. Products you add via the admin panel will replace
          this demo data.
        </div>
      )}

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
                  <span>
                    ₹{Number(product.price).toLocaleString("en-IN")}
                  </span>
                  {product.categories && (
                    <span>
                      {
                        (product.categories as unknown as { name: string })
                          .name
                      }
                    </span>
                  )}
                  <span>
                    {new Date(product.created_at).toLocaleDateString("en-IN")}
                  </span>
                </div>
              </div>
              {!isDemo && <AdminProductActions productId={product.id} productSlug={product.slug} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
