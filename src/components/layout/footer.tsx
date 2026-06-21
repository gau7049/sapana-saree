import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="text-lg font-bold">{SITE_NAME}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Discover exquisite sarees for every occasion. From traditional
              Banarasi silk to modern designer collections.
            </p>
          </div>

          <div>
            <h4 className="font-semibold">Quick Links</h4>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/sarees" className="hover:text-primary">
                  All Sarees
                </Link>
              </li>
              <li>
                <Link href="/categories" className="hover:text-primary">
                  Categories
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-primary">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold">Customer</h4>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/account" className="hover:text-primary">
                  My Account
                </Link>
              </li>
              <li>
                <Link href="/wishlist" className="hover:text-primary">
                  Wishlist
                </Link>
              </li>
              <li>
                <Link href="/account/inquiries" className="hover:text-primary">
                  My Inquiries
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold">Contact</h4>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              <li>Email: contact@sapanasaree.com</li>
              <li>WhatsApp: Order via WhatsApp</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
