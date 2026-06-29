import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug, getRelatedProducts } from "@/lib/queries/products";
import { getProductReviews } from "@/lib/queries/reviews";
import { ProductGallery } from "@/components/products/product-gallery";
import { ProductInfo } from "@/components/products/product-info";
import { BuyNowButton } from "@/components/products/buy-now-button";
import { WishlistButton } from "@/components/products/wishlist-button";
import { ProductReviews } from "@/components/products/product-reviews";
import { ReviewForm } from "@/components/products/review-form";
import { RelatedProducts } from "@/components/products/related-products";
import { Separator } from "@/components/ui/separator";
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
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) return { title: "Product Not Found" };

  const primaryImage =
    product.product_images?.find((img) => img.is_primary) ??
    product.product_images?.[0];

  return {
    title: `${product.meta_title ?? product.title} | ${SITE_NAME}`,
    description:
      product.meta_description ??
      product.short_description ??
      product.description?.slice(0, 160),
    alternates: { canonical: `${SITE_URL}/sarees/${product.slug}` },
    openGraph: {
      title: product.title,
      description: product.short_description ?? undefined,
      images: primaryImage
        ? [{ url: primaryImage.url, width: 1200, height: 630 }]
        : undefined,
      type: "website",
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const [{ reviews }, relatedProducts] = await Promise.all([
    getProductReviews(product.id),
    getRelatedProducts(product.id, product.category_id),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: product.product_images?.map((img) => img.url),
    brand: { "@type": "Brand", name: SITE_NAME },
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
    },
    ...(product.review_count > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: product.avg_rating,
        reviewCount: product.review_count,
      },
    }),
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
              <BreadcrumbLink href="/sarees">Sarees</BreadcrumbLink>
            </BreadcrumbItem>
            {product.categories && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink
                    href={`/categories/${product.categories.slug}`}
                  >
                    {product.categories.name}
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </>
            )}
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{product.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-2">
          <ProductGallery images={product.product_images ?? []} />

          <div className="space-y-4">
            <ProductInfo product={product} />
            <BuyNowButton product={product} />
            <WishlistButton productId={product.id} />
          </div>
        </div>

        <Separator className="my-12" />

        <div>
          <h2 className="text-xl font-bold">
            Reviews ({product.review_count})
          </h2>
          <div className="mt-6 space-y-8">
            <ReviewForm productId={product.id} />
            <ProductReviews reviews={reviews} />
          </div>
        </div>

        <RelatedProducts products={relatedProducts} />
      </div>
    </>
  );
}
