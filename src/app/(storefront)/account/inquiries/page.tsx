import Link from "next/link";
import { createMetadata } from "@/lib/seo";
import { getCurrentProfile } from "@/lib/auth-guard";
import { getUserInquiries } from "@/lib/queries/inquiries";
import { EmptyState } from "@/components/shared/empty-state";
import { WhatsAppLink } from "@/components/shared/whatsapp-link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { WHATSAPP_NUMBER, COD_CHARGE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { MessageCircle, Video, Check } from "lucide-react";

export const metadata = createMetadata({
  title: "My Inquiries",
  description: "View your WhatsApp inquiry history",
  path: "/account/inquiries",
});

const STATUS_STYLE: Record<string, string> = {
  initiated: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  sent: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  responded: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  shipped: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const TIMELINE_STEPS = ["Order started", "Confirmed", "Shipped", "Delivered"] as const;

function timelineIndex(status: string): number {
  switch (status) {
    case "responded":
      return 1;
    case "shipped":
      return 2;
    case "delivered":
    case "completed":
      return 3;
    default:
      return 0;
  }
}

function formatDate(value: string | null | undefined) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
  });
}

export default async function AccountInquiriesPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const inquiries = await getUserInquiries(profile.id);

  if (inquiries.length === 0) {
    return (
      <EmptyState
        icon={MessageCircle}
        title="No inquiries yet"
        description="When you click Buy Now on a product, it'll show up here."
      />
    );
  }

  return (
    <div className="space-y-3">
      {inquiries.map((inquiry) => {
        const cancelled = inquiry.status === "cancelled";
        const activeStep = timelineIndex(inquiry.status);
        const stepDates: (string | null)[] = [
          formatDate(inquiry.created_at),
          null,
          formatDate(inquiry.shipped_at),
          formatDate(inquiry.delivered_at),
        ];
        const showUnboxingReminder =
          inquiry.status === "shipped" || inquiry.status === "delivered";

        return (
          <div key={inquiry.id} className="rounded-lg border bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Link
                  href={`/sarees/${inquiry.products?.slug ?? ""}`}
                  className="font-medium hover:text-primary"
                >
                  {inquiry.products?.title ?? "Unknown product"}
                </Link>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  ₹{Number(inquiry.products?.price ?? 0).toLocaleString("en-IN")}
                  {inquiry.payment_method && (
                    <span>
                      {" · "}
                      {inquiry.payment_method === "cod"
                        ? `Cash on Delivery (+₹${COD_CHARGE})`
                        : "Online payment"}
                    </span>
                  )}
                </p>
              </div>
              <Badge
                variant="secondary"
                className={STATUS_STYLE[inquiry.status] ?? ""}
              >
                {inquiry.status}
              </Badge>
            </div>

            {!cancelled && (
              <div className="mt-4">
                <ol className="flex items-center">
                  {TIMELINE_STEPS.map((label, i) => {
                    const reached = i <= activeStep;
                    return (
                      <li
                        key={label}
                        className={cn("flex items-center", i > 0 && "flex-1")}
                      >
                        {i > 0 && (
                          <span
                            className={cn(
                              "mx-1 h-0.5 flex-1 rounded",
                              i <= activeStep ? "bg-primary" : "bg-border"
                            )}
                          />
                        )}
                        <span className="flex flex-col items-center gap-1">
                          <span
                            className={cn(
                              "flex h-5 w-5 items-center justify-center rounded-full text-[10px]",
                              reached
                                ? "bg-primary text-primary-foreground"
                                : "border bg-muted text-muted-foreground"
                            )}
                          >
                            {reached ? <Check className="h-3 w-3" /> : i + 1}
                          </span>
                          <span
                            className={cn(
                              "whitespace-nowrap text-[10px] sm:text-xs",
                              reached
                                ? "font-medium"
                                : "text-muted-foreground"
                            )}
                          >
                            {label}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {stepDates[i] ?? " "}
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}

            {inquiry.tracking_number && (
              <p className="mt-3 rounded bg-muted p-2 text-sm">
                <span className="font-medium">Tracking: </span>
                {[inquiry.tracking_courier, inquiry.tracking_number]
                  .filter(Boolean)
                  .join(" — ")}
              </p>
            )}

            {showUnboxingReminder && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-300/60 bg-amber-50 p-3 text-sm dark:border-amber-700/60 dark:bg-amber-950/40">
                <Video className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-500" />
                <div className="min-w-0">
                  <p className="font-medium text-amber-900 dark:text-amber-200">
                    Before opening your package
                  </p>
                  <p className="mt-0.5 text-amber-800 dark:text-amber-300">
                    Record one uncut, unpaused video of the unboxing — starting
                    from the sealed package. It&apos;s required for any damage or
                    wrong-item claim.{" "}
                    <Link href="/policies" className="underline">
                      See policy
                    </Link>
                    .
                  </p>
                  <WhatsAppLink
                    href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                      `Hi! Sharing my unboxing video for: ${inquiry.products?.title ?? "my order"}`
                    )}`}
                    kind="unboxing"
                    logMessage={`Unboxing video for: ${inquiry.products?.title ?? "order"}`}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "mt-2 h-auto max-w-full items-start py-1.5 text-left whitespace-normal"
                    )}
                  >
                    <Video className="mt-0.5 mr-1.5 h-3.5 w-3.5 shrink-0" />
                    Send unboxing video on WhatsApp
                  </WhatsAppLink>
                </div>
              </div>
            )}

            <div className="mt-3 flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                {new Date(inquiry.created_at).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
              {/* Lets the customer resume an interrupted handoff (e.g. a
                  popup-blocked WhatsApp tab) with the original order message. */}
              {(inquiry.status === "initiated" || inquiry.status === "sent") &&
                inquiry.whatsapp_message && (
                  <WhatsAppLink
                    href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(inquiry.whatsapp_message)}`}
                    kind="inquiry_reopen"
                    logMessage={inquiry.whatsapp_message}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
                    Open WhatsApp
                  </WhatsAppLink>
                )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
