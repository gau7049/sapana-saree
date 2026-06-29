import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import { getCategoryBySlug } from "@/lib/queries/categories";
import { getProducts } from "@/lib/queries/products";
import { ProductGrid } from "@/components/products/product-grid";
import { ProductSort } from "@/components/products/product-sort";
import { Pagination } from "@/components/shared/pagination";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export const revalidate = 3600;

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Category Not Found" };

  return {
    title: `${category.name} Sarees | ${SITE_NAME}`,
    description:
      category.description ??
      `Browse our collection of ${category.name} sarees at ${SITE_NAME}.`,
    alternates: { canonical: `${SITE_URL}/categories/${category.slug}` },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const page = Number(sp.page) || 1;

  const [category, { products, total, totalPages }] = await Promise.all([
    getCategoryBySlug(slug),
    getProducts({
      category: slug,
      sort: sp.sort,
      minPrice: sp.minPrice ? Number(sp.minPrice) : undefined,
      maxPrice: sp.maxPrice ? Number(sp.maxPrice) : undefined,
      page,
    }),
  ]);

  if (!category) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${category.name} Sarees`,
    description:
      category.description ??
      `Browse ${category.name} sarees at ${SITE_NAME}`,
    url: `${SITE_URL}/categories/${category.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/categories">Categories</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{category.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mt-6 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {category.name}
            </h1>
            {category.description && (
              <p className="mt-1 text-muted-foreground">
                {category.description}
              </p>
            )}
            <p className="mt-1 text-sm text-muted-foreground">
              {total} {total === 1 ? "product" : "products"}
            </p>
          </div>
          <Suspense>
            <ProductSort />
          </Suspense>
        </div>

        <div className="mt-8 space-y-8">
          <ProductGrid products={products} />
          <Suspense>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              basePath={`/categories/${slug}`}
            />
          </Suspense>
        </div>
      </div>
    </>
  );
}
