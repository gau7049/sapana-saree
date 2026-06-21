import { createMetadata } from "@/lib/seo";
import { SITE_NAME } from "@/lib/constants";

export const metadata = createMetadata({
  title: "About Us",
  description: `Learn about ${SITE_NAME} — our story, mission, and commitment to quality sarees.`,
  path: "/about",
});

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">About {SITE_NAME}</h1>

      <div className="mt-8 space-y-6 text-muted-foreground">
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
        <p>
          We work directly with skilled artisans and weavers to bring you
          authentic, high-quality sarees at fair prices. Every piece in our
          collection is handpicked for its quality, design, and craftsmanship.
        </p>

        <h2 className="text-xl font-semibold text-foreground pt-4">
          Why Choose Us?
        </h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Authentic sarees sourced directly from weavers</li>
          <li>Wide variety of styles for every occasion</li>
          <li>Quality guaranteed on every product</li>
          <li>Easy ordering via WhatsApp</li>
          <li>Personal attention to every customer</li>
        </ul>
      </div>
    </div>
  );
}
