import Image from "next/image";
import { createMetadata } from "@/lib/seo";
import { SITE_NAME } from "@/lib/constants";

export const metadata = createMetadata({
  title: "About Us",
  description: `Learn about ${SITE_NAME} — our story, mission, and commitment to quality sarees.`,
  path: "/about",
});

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="relative aspect-video overflow-hidden border border-border bg-muted sm:aspect-21/9">
        <Image
          src="/images/about-wide.jpg"
          alt="Woman in a traditional red silk saree seated outside a heritage building"
          fill
          priority
          sizes="(max-width: 896px) 100vw, 896px"
          className="object-cover"
        />
      </div>

      <h1 className="mt-8 text-2xl font-bold tracking-tight sm:text-3xl">
        About {SITE_NAME}
      </h1>

      <div className="mt-6 space-y-4 text-muted-foreground">
        <p>
          Welcome to {SITE_NAME}, your destination for exquisite Indian sarees.
          We believe every saree tells a story — of tradition, craftsmanship,
          and timeless elegance.
        </p>
        <p>
          Our carefully curated collection brings together the finest sarees
          from across India — from luxurious Banarasi silks to lightweight
          cottons, from rich wedding sarees to everyday wear.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 items-center gap-6 sm:grid-cols-2 sm:gap-8">
        <div className="relative aspect-square overflow-hidden border border-border bg-muted">
          <Image
            src="/images/about-side.jpg"
            alt="Woman in a vibrant printed saree"
            fill
            sizes="(max-width: 640px) 100vw, 448px"
            className="object-cover"
          />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground sm:text-xl">
            Why Choose Us?
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>Authentic sarees sourced directly from weavers</li>
            <li>Wide variety of styles for every occasion</li>
            <li>Quality guaranteed on every product</li>
            <li>Easy ordering via WhatsApp</li>
            <li>Personal attention to every customer</li>
          </ul>
        </div>
      </div>

      <p className="mt-10 text-muted-foreground">
        We work directly with skilled artisans and weavers to bring you
        authentic, high-quality sarees at fair prices. Every piece in our
        collection is handpicked for its quality, design, and craftsmanship.
      </p>
    </div>
  );
}
