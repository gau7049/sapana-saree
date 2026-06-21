import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCategories } from "@/lib/queries/categories";

export async function CategoryShowcase() {
  const categories = await getCategories();

  if (categories.length === 0) return null;

  return (
    <section className="bg-muted/30 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Shop by Category
          </h2>
          <p className="mt-1 text-muted-foreground">
            Find the perfect saree for every occasion
          </p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categories.slice(0, 6).map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="flex flex-col items-center justify-center rounded-xl border bg-card p-6 text-center transition-all hover:shadow-md hover:-translate-y-1"
            >
              <span className="mb-2 text-3xl">🪡</span>
              <span className="text-sm font-medium">{category.name}</span>
            </Link>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/categories"
            className={cn(buttonVariants({ variant: "outline" }), "gap-1")}
          >
            View All Categories
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
