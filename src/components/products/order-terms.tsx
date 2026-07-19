import Link from "next/link";
import { Truck, Banknote, PackageX, Video } from "lucide-react";
import { ORDER_TERMS } from "@/lib/constants";

const TERM_ICONS = [Truck, Banknote, PackageX, Video];

/**
 * The store's order conditions (delivery window, COD charge, no returns,
 * mandatory unboxing video), shown BEFORE the customer starts a WhatsApp
 * order. Surfacing these up front prevents disputes later — especially
 * important with a strict no-return policy.
 */
export function OrderTerms({ compact = false }: { compact?: boolean }) {
  return (
    <div className="rounded-md border border-dashed border-muted-foreground/50 p-3">
      <div className="flex flex-wrap gap-2">
        {ORDER_TERMS.map((term, i) => {
          const Icon = TERM_ICONS[i] ?? Truck;
          return (
            <span
              key={term}
              className={`inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-2.5 py-1 text-muted-foreground ${
                compact ? "text-[11px]" : "text-xs"
              }`}
            >
              <Icon className="h-3 w-3 shrink-0" />
              {term}
            </span>
          );
        })}
      </div>
      {!compact && (
        <Link
          href="/policies"
          className="mt-2.5 inline-block text-xs font-medium underline underline-offset-2 hover:text-foreground"
        >
          Read full ordering &amp; delivery policy
        </Link>
      )}
    </div>
  );
}
