import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCategories } from "@/lib/queries/categories";
import { CATEGORY_EMOJIS } from "@/lib/category-emojis";

export async function CategoryShowcase() {
  const categories = await getCategories();

  if (categories.length === 0) return null;

  return (
    <section className="border-b bg-card py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold sm:text-xl">
            Shop by Category
          </h2>
          <Link
            href="/categories"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "gap-1 text-primary"
            )}
          >
            See All
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-5 flex gap-4 overflow-x-auto pb-2 scrollbar-none sm:gap-6 lg:justify-center">
          {categories.slice(0, 8).map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="group flex shrink-0 flex-col items-center gap-2.5"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-card text-2xl transition-colors group-hover:border-foreground/40 sm:h-16 sm:w-16 sm:text-3xl">
                {CATEGORY_EMOJIS[category.slug] ?? "🪡"}
              </div>
              <span className="max-w-20 text-center text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground sm:text-sm">
                {category.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
