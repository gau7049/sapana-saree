import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth-guard";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Overview", href: "/account" },
  { label: "Address", href: "/account/address" },
  { label: "Inquiries", href: "/account/inquiries" },
  { label: "Reviews", href: "/account/reviews" },
];

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?redirect=/account");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        My Account
      </h1>

      <nav className="mt-6 flex gap-1 border-b">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "border-b-2 border-transparent px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <div className="mt-6">{children}</div>
    </div>
  );
}
