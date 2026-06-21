import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getFeaturedProducts } from "@/lib/queries/products";
import { ProductCard } from "@/components/products/product-card";

export async function FeaturedProducts() {
  const products = await getFeaturedProducts();

  if (products.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Featured Sarees
          </h2>
          <p className="mt-1 text-muted-foreground">
            Handpicked favorites from our collection
          </p>
        </div>
        <Link
          href="/sarees?featured=true"
          className={cn(buttonVariants({ variant: "ghost" }), "gap-1")}
        >
          View All
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.slice(0, 8).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
