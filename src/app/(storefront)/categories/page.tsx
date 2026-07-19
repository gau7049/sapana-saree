import Link from "next/link";
import { createMetadata } from "@/lib/seo";
import { getCategoryTree } from "@/lib/queries/categories";
import { CATEGORY_EMOJIS } from "@/lib/category-emojis";
import { EmptyState } from "@/components/shared/empty-state";
import { ProgressiveImage } from "@/components/shared/progressive-image";
import { FolderOpen } from "lucide-react";
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
  title: "Categories",
  description: "Browse sarees by category — silk, cotton, designer, wedding, and more.",
  path: "/categories",
});

export default async function CategoriesPage() {
  const categories = await getCategoryTree();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Categories</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="mt-6 text-2xl font-bold tracking-tight sm:text-3xl">
        All Categories
      </h1>

      {categories.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No categories yet"
          description="Categories will appear here once added by the admin."
        />
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="group block border border-border bg-card transition-colors hover:border-foreground/30"
            >
              <div className="relative aspect-4/3 overflow-hidden bg-muted">
                {category.image_url ? (
                  <ProgressiveImage
                    src={category.image_url}
                    alt={category.name}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-4xl">
                    {CATEGORY_EMOJIS[category.slug] ?? "🪡"}
                  </div>
                )}
              </div>
              <div className="p-3">
                <h2 className="text-sm font-semibold group-hover:text-foreground sm:text-base">
                  {category.name}
                </h2>
                {category.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground sm:text-sm">
                    {category.description}
                  </p>
                )}
                {category.subcategories.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {category.subcategories.map((sub) => (
                      <span
                        key={sub.id}
                        className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground"
                      >
                        {sub.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
