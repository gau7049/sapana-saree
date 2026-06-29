import Link from "next/link";
import { createMetadata } from "@/lib/seo";
import { getCategoryTree } from "@/lib/queries/categories";
import { EmptyState } from "@/components/shared/empty-state";
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
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="group rounded-xl border bg-card p-6 transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              <h2 className="text-lg font-semibold group-hover:text-primary">
                {category.name}
              </h2>
              {category.description && (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {category.description}
                </p>
              )}
              {category.subcategories.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {category.subcategories.map((sub) => (
                    <span
                      key={sub.id}
                      className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
                    >
                      {sub.name}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
