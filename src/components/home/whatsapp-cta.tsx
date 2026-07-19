import { WhatsAppIcon } from "@/components/shared/icons";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { buildGenericWhatsAppUrl } from "@/lib/whatsapp";
import { WHATSAPP_NUMBER } from "@/lib/constants";

export function WhatsAppCTA() {
  if (!WHATSAPP_NUMBER) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-xl border bg-card p-6 text-center sm:p-10">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366]/10">
          <WhatsAppIcon className="h-6 w-6 text-[#25D366]" />
        </div>
        <h2 className="mt-4 text-lg font-bold sm:text-xl">
          Need help finding the perfect saree?
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Chat with us on WhatsApp. Share your preference — color, fabric,
          budget — and we&apos;ll help you find it.
        </p>
        <div className="mt-6">
          <a
            href={buildGenericWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ size: "lg" }),
              "gap-2 bg-[#25D366] hover:bg-[#1da851]"
            )}
          >
            <WhatsAppIcon className="h-5 w-5" />
            Chat on WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
