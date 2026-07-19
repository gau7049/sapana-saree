import { Suspense } from "react";
import { HeroSection } from "@/components/home/hero-section";
import { TrustBadges } from "@/components/home/trust-badges";
import { CategoryShowcase } from "@/components/home/category-showcase";
import { DealsBanner } from "@/components/home/deals-banner";
import { FeaturedProducts } from "@/components/home/featured-products";
import { WhatsAppCTA } from "@/components/home/whatsapp-cta";
import { Skeleton } from "@/components/ui/skeleton";
import { SITE_NAME, SITE_DESCRIPTION, SITE_URL } from "@/lib/constants";

function ProductsSkeleton() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Skeleton className="h-6 w-40" />
      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border">
            <Skeleton className="aspect-3/4 w-full" />
            <div className="space-y-2 p-3">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-4 w-1/3" />
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
      <Suspense
        fallback={
          <section className="border-b bg-card py-8">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <Skeleton className="h-6 w-40" />
              <div className="mt-5 flex gap-6 justify-center">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-2.5">
                    <Skeleton className="h-20 w-20 rounded-full" />
                    <Skeleton className="h-3 w-14" />
                  </div>
                ))}
              </div>
            </div>
          </section>
        }
      >
        <CategoryShowcase />
      </Suspense>
      <DealsBanner />
      <Suspense fallback={<ProductsSkeleton />}>
        <FeaturedProducts />
      </Suspense>
      <TrustBadges />
      <WhatsAppCTA />
    </>
  );
}
