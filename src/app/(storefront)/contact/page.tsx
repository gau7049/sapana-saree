import { createMetadata } from "@/lib/seo";
import { ContactForm } from "@/components/shared/contact-form";

export const metadata = createMetadata({
  title: "Contact Us",
  description: "Get in touch with Sapana Saree. We'd love to hear from you.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">Contact Us</h1>
      <p className="mt-2 text-muted-foreground">
        Have a question or feedback? Send us a message and we&apos;ll get back
        to you as soon as possible.
      </p>

      <div className="mt-8">
        <ContactForm />
      </div>
    </div>
  );
}
