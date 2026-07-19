import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { SITE_NAME } from "@/lib/constants";
import { buildGenericWhatsAppUrl } from "@/lib/whatsapp";
import { WhatsAppIcon, InstagramIcon } from "@/components/shared/icons";

const QUICK_LINKS = [
  { label: "Home", href: "/" },
  { label: "All Sarees", href: "/sarees" },
  { label: "Categories", href: "/categories" },
  { label: "About Us", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const CUSTOMER_LINKS = [
  { label: "My Account", href: "/account" },
  { label: "Wishlist", href: "/wishlist" },
  { label: "My Inquiries", href: "/account/inquiries" },
  { label: "My Reviews", href: "/account/reviews" },
  { label: "Ordering & Delivery Policy", href: "/policies" },
];

function FooterLinkList({ links }: { links: { label: string; href: string }[] }) {
  return (
    <ul className="space-y-2">
      {links.map((link) => (
        <li key={link.href}>
          <Link
            href={link.href}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Accordion row for the mobile footer — native <details> needs no client JS. */
function FooterAccordionSection({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <details className="group border-b border-border py-1">
      <summary className="flex cursor-pointer list-none items-center justify-between py-2 text-sm font-medium [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="pb-3">
        <FooterLinkList links={links} />
      </div>
    </details>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12">
        {/* Mobile: accordion sections (< sm) */}
        <div className="sm:hidden">
          <FooterAccordionSection title="Quick Links" links={QUICK_LINKS} />
          <FooterAccordionSection title="Customer Care" links={CUSTOMER_LINKS} />
          <a
            href={buildGenericWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between border-b border-border py-3 text-sm"
          >
            Contact on WhatsApp
            <WhatsAppIcon className="h-4 w-4 text-muted-foreground" />
          </a>
          <p className="mt-4 text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} {SITE_NAME}
          </p>
        </div>

        {/* Tablet: 2-column grid (sm to <lg) */}
        <div className="hidden sm:block lg:hidden">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold">Quick Links</h4>
              <div className="mt-3">
                <FooterLinkList links={QUICK_LINKS} />
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold">Customer</h4>
              <div className="mt-3">
                <FooterLinkList links={CUSTOMER_LINKS} />
              </div>
            </div>
          </div>
          <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
            <span>
              &copy; {new Date().getFullYear()} {SITE_NAME}
            </span>
            <div className="flex items-center gap-3">
              <a
                href={buildGenericWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat on WhatsApp"
                className="hover:text-foreground"
              >
                <WhatsAppIcon className="h-4 w-4" />
              </a>
              <a
                href="https://www.instagram.com/sapana_saree_"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow us on Instagram"
                className="hover:text-foreground"
              >
                <InstagramIcon className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Desktop: 4-column grid (lg+) */}
        <div className="hidden lg:grid lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:gap-8">
          <div>
            <Link href="/" className="inline-block">
              <span className="text-lg font-bold">{SITE_NAME}</span>
            </Link>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Handpicked sarees for every occasion. Orders confirmed and
              delivered over WhatsApp.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <a
                href="https://www.instagram.com/sapana_saree_"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                aria-label="Follow us on Instagram"
              >
                <InstagramIcon className="h-4 w-4" />
              </a>
              <a
                href={buildGenericWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-[#25D366] hover:text-[#25D366]"
                aria-label="Chat on WhatsApp"
              >
                <WhatsAppIcon className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold">Quick Links</h4>
            <div className="mt-3">
              <FooterLinkList links={QUICK_LINKS} />
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold">Customer</h4>
            <div className="mt-3">
              <FooterLinkList links={CUSTOMER_LINKS} />
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold">Contact</h4>
            <ul className="mt-3 space-y-2.5 text-sm">
              <li>
                <a
                  href="https://www.instagram.com/sapana_saree_"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <InstagramIcon className="h-4 w-4" />
                  @sapana_saree_
                </a>
              </li>
              <li className="text-muted-foreground">contact@sapanasaree.com</li>
              <li>
                <a
                  href={buildGenericWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  Order via WhatsApp
                </a>
              </li>
            </ul>
          </div>

          <div className="col-span-4 mt-4 border-t border-border pt-6 text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
