import Link from "next/link";
import { ArrowRight, Clock, Percent } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DealsBanner() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-xl bg-linear-to-r from-primary to-primary/85 p-6 text-primary-foreground sm:p-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="hidden h-12 w-12 items-center justify-center rounded-lg bg-white/15 sm:flex">
              <Percent className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold sm:text-xl">
                Mega Saree Sale
              </h3>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-primary-foreground/80">
                <Clock className="h-3.5 w-3.5" />
                Up to 50% off on selected collections
              </p>
            </div>
          </div>
          <Link
            href="/sarees"
            className={cn(
              buttonVariants({ size: "sm" }),
              "gap-1.5 bg-white text-primary shadow-none hover:bg-white/90"
            )}
          >
            Shop Deals
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
