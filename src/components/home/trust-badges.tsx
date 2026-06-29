import { Truck, Shield, HeadphonesIcon, RefreshCw } from "lucide-react";

const BADGES = [
  {
    icon: Truck,
    title: "Free Delivery",
    description: "On all orders",
  },
  {
    icon: Shield,
    title: "100% Authentic",
    description: "Genuine sarees",
  },
  {
    icon: HeadphonesIcon,
    title: "WhatsApp Support",
    description: "Quick response",
  },
  {
    icon: RefreshCw,
    title: "Easy Returns",
    description: "Hassle-free",
  },
];

export function TrustBadges() {
  return (
    <section className="border-b bg-card">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {BADGES.map((badge) => (
            <div
              key={badge.title}
              className="flex items-center gap-3"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/5">
                <badge.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold sm:text-sm">{badge.title}</p>
                <p className="text-[11px] text-muted-foreground">
                  {badge.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
