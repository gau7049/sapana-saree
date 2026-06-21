import { Suspense } from "react";
import { HeroSection } from "@/components/home/hero-section";
import { FeaturedProducts } from "@/components/home/featured-products";
import { CategoryShowcase } from "@/components/home/category-showcase";
import { Skeleton } from "@/components/ui/skeleton";
import { SITE_NAME, SITE_DESCRIPTION, SITE_URL } from "@/lib/constants";

function ProductsSkeleton() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <Skeleton className="h-8 w-48" />
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border">
            <Skeleton className="aspect-3/4 w-full" />
            <div className="p-4 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-5 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HeroSection />
      <Suspense fallback={<ProductsSkeleton />}>
        <FeaturedProducts />
      </Suspense>
      <Suspense>
        <CategoryShowcase />
      </Suspense>
    </>
  );
}
