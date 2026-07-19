import { createMetadata } from "@/lib/seo";
import { ContactForm } from "@/components/shared/contact-form";
import { WhatsAppIcon } from "@/components/shared/icons";
import { buildGenericWhatsAppUrl } from "@/lib/whatsapp";

export const metadata = createMetadata({
  title: "Contact Us",
  description: "Get in touch with Sapana Saree. We'd love to hear from you.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="grid grid-cols-1 gap-10 sm:grid-cols-[1.2fr_1fr] sm:gap-8 lg:gap-12">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Contact Us
          </h1>
          <p className="mt-2 text-muted-foreground">
            Have a question or feedback? Send us a message and we&apos;ll get
            back to you as soon as possible.
          </p>

          <div className="mt-8">
            <ContactForm />
          </div>
        </div>

        <div className="border-t border-border pt-6 sm:border-l sm:border-t-0 sm:pl-8 sm:pt-1">
          <p className="text-sm font-medium">Prefer to chat directly?</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Message us on WhatsApp for the fastest response — great for
            questions before you order.
          </p>
          <a
            href={buildGenericWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm transition-colors hover:border-[#25D366] hover:text-[#25D366]"
          >
            <WhatsAppIcon className="h-4 w-4" />
            Chat on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
