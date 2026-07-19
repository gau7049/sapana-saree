import { Truck, Shield, HeadphonesIcon, Award } from "lucide-react";

const BADGES = [
  { icon: Truck, label: "COD Available" },
  { icon: Shield, label: "100% Handpicked" },
  { icon: HeadphonesIcon, label: "WhatsApp Support" },
  { icon: Award, label: "Trusted Reseller" },
];

/** A row of outlined trust pills, shown below the featured products on the homepage. */
export function TrustBadges() {
  return (
    <section className="border-b border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {BADGES.map((badge) => (
            <span
              key={badge.label}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium sm:text-sm"
            >
              <badge.icon className="h-3.5 w-3.5 text-muted-foreground" />
              {badge.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
