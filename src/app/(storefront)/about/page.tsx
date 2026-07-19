import { createMetadata } from "@/lib/seo";
import { SITE_NAME } from "@/lib/constants";

export const metadata = createMetadata({
  title: "About Us",
  description: `Learn about ${SITE_NAME} — our story, mission, and commitment to quality sarees.`,
  path: "/about",
});

function ImagePlaceholder({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex aspect-4/3 items-center justify-center border border-border bg-muted text-3xl ${className}`}
    >
      🪡
    </div>
  );
}

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <ImagePlaceholder className="aspect-video sm:aspect-21/9" />

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
        <ImagePlaceholder />
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
