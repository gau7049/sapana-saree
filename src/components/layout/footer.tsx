import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";
import { WhatsAppIcon, InstagramIcon } from "@/components/shared/icons";

const QUICK_LINKS = [
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
];

export function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="inline-block">
              <span className="text-lg font-bold text-primary">{SITE_NAME}</span>
            </Link>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Exquisite sarees for every occasion. Traditional Banarasi silk to
              modern designer collections.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <a
                href="https://www.instagram.com/sapana_saree_"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                aria-label="Follow us on Instagram"
              >
                <InstagramIcon className="h-4 w-4" />
              </a>
              <a
                href="https://wa.me/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors hover:bg-[#25D366]/10 hover:text-[#25D366]"
                aria-label="Chat on WhatsApp"
              >
                <WhatsAppIcon className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold">Quick Links</h4>
            <ul className="mt-3 space-y-2">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold">Customer</h4>
            <ul className="mt-3 space-y-2">
              {CUSTOMER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold">Connect</h4>
            <ul className="mt-3 space-y-2.5 text-sm">
              <li>
                <a
                  href="https://www.instagram.com/sapana_saree_"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
                >
                  <InstagramIcon className="h-4 w-4" />
                  @sapana_saree_
                </a>
              </li>
              <li className="text-muted-foreground">
                contact@sapanasaree.com
              </li>
              <li className="text-muted-foreground">
                Order via WhatsApp
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-6 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
