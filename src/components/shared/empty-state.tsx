import Link from "next/link";
import { Package } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon = Package,
  title,
  description,
  actionLabel,
  actionHref,
  children,
}: {
  icon?: React.ElementType;
  title: string;
  description?: string;
  /** Renders a filled CTA button linking to actionHref, e.g. "Browse All Sarees". */
  actionLabel?: string;
  actionHref?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className={cn(buttonVariants({ size: "sm" }), "mt-5")}
        >
          {actionLabel}
        </Link>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
