import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCategories } from "@/lib/queries/categories";

const CATEGORY_EMOJIS: Record<string, string> = {
  banarasi: "🏛️",
  silk: "✨",
  cotton: "🌿",
  designer: "💎",
  wedding: "💐",
  casual: "🌸",
  party: "🎉",
  traditional: "🪔",
};

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
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-2xl ring-2 ring-transparent transition-all group-hover:ring-primary/30 sm:h-20 sm:w-20 sm:text-3xl">
                {CATEGORY_EMOJIS[category.slug] ?? "🪡"}
              </div>
              <span className="max-w-20 text-center text-xs font-medium text-muted-foreground transition-colors group-hover:text-primary sm:text-sm">
                {category.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
