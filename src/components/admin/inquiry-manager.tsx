"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { updateInquiryStatus } from "@/actions/inquiries";
import { handleAction } from "@/lib/action-handler";
import { COD_CHARGE } from "@/lib/constants";
import type { InquiryStatus } from "@/types";

interface InquiryRow {
  id: string;
  status: string;
  whatsapp_message: string;
  notes: string | null;
  payment_method: string | null;
  tracking_courier: string | null;
  tracking_number: string | null;
  points_redeemed: number;
  created_at: string;
  profiles: {
    full_name: string | null;
    username: string;
    phone: string | null;
    address_line1: string | null;
    address_line2: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    postal_code: string | null;
    loyalty_transactions?: { points: number }[];
  } | null;
  products: { title: string; slug: string; price: number } | null;
}

const STATUS_STYLE: Record<string, string> = {
  initiated: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  sent: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  responded: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  shipped: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

// Lifecycle: initiated → responded → shipped → delivered → completed.
// "shipped" is entered through the tracking dialog instead of this map.
const NEXT_STATUS: Record<string, InquiryStatus> = {
  initiated: "responded",
  sent: "responded",
  shipped: "delivered",
  delivered: "completed",
};

// Cancelling only makes sense before the parcel is on its way.
const CANCELLABLE = new Set(["initiated", "sent", "responded"]);

export function InquiryManager({ inquiries }: { inquiries: InquiryRow[] }) {
  const router = useRouter();
  const [shipTarget, setShipTarget] = useState<InquiryRow | null>(null);
  const [shipping, setShipping] = useState(false);

  async function handleStatusChange(id: string, status: InquiryStatus) {
    await handleAction(updateInquiryStatus(id, status), {
      onSuccess: () => router.refresh(),
    });
  }

  async function handleShip(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!shipTarget) return;
    const formData = new FormData(e.currentTarget);
    setShipping(true);
    await handleAction(
      updateInquiryStatus(shipTarget.id, "shipped", {
        trackingCourier: (formData.get("courier") as string) ?? "",
        trackingNumber: (formData.get("tracking") as string) ?? "",
      }),
      {
        onSuccess: () => {
          setShipTarget(null);
          router.refresh();
        },
      }
    );
    setShipping(false);
  }

  return (
    <div className="space-y-3">
      {inquiries.map((inquiry) => (
        <div key={inquiry.id} className="rounded-lg border bg-card p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium">
                {inquiry.products?.title ?? "Unknown product"}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                ₹{Number(inquiry.products?.price ?? 0).toLocaleString("en-IN")}
                {inquiry.payment_method && (
                  <span>
                    {" · "}
                    {inquiry.payment_method === "cod"
                      ? `COD (+₹${COD_CHARGE})`
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

          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Customer: </span>
              <span className="font-medium">
                {inquiry.profiles?.full_name ?? inquiry.profiles?.username ?? "Unknown"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Points balance: </span>
              <span className="font-medium">
                {(inquiry.profiles?.loyalty_transactions ?? []).reduce(
                  (sum, tx) => sum + tx.points,
                  0
                )}
                {inquiry.points_redeemed > 0 && (
                  <span className="text-muted-foreground">
                    {" "}
                    · redeemed {inquiry.points_redeemed} on this order
                  </span>
                )}
              </span>
            </div>
            {inquiry.profiles?.phone && (
              <div>
                <span className="text-muted-foreground">Phone: </span>
                <span className="font-medium">{inquiry.profiles.phone}</span>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Date: </span>
              <span>
                {new Date(inquiry.created_at).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>

          {inquiry.profiles?.address_line1 && (
            <p className="mt-2 rounded bg-muted p-2 text-sm">
              <span className="font-medium">Address: </span>
              {[
                inquiry.profiles.address_line1,
                inquiry.profiles.address_line2,
                [inquiry.profiles.city, inquiry.profiles.state, inquiry.profiles.postal_code]
                  .filter(Boolean)
                  .join(", "),
                inquiry.profiles.country,
              ]
                .filter(Boolean)
                .join(", ")}
            </p>
          )}

          {inquiry.tracking_number && (
            <p className="mt-2 rounded bg-muted p-2 text-sm">
              <span className="font-medium">Tracking: </span>
              {[inquiry.tracking_courier, inquiry.tracking_number]
                .filter(Boolean)
                .join(" — ")}
            </p>
          )}

          {inquiry.notes && (
            <p className="mt-2 rounded bg-muted p-2 text-sm">
              <span className="font-medium">Notes: </span>
              {inquiry.notes}
            </p>
          )}

          <div className="mt-3 flex gap-2">
            {inquiry.status === "responded" && (
              <button
                onClick={() => setShipTarget(inquiry)}
                className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
              >
                Mark as shipped
              </button>
            )}
            {NEXT_STATUS[inquiry.status] && (
              <button
                onClick={() =>
                  handleStatusChange(inquiry.id, NEXT_STATUS[inquiry.status])
                }
                className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
              >
                Mark as {NEXT_STATUS[inquiry.status]}
              </button>
            )}
            {CANCELLABLE.has(inquiry.status) && (
              <button
                onClick={() => handleStatusChange(inquiry.id, "cancelled")}
                className="rounded-md border px-3 py-1 text-xs font-medium text-destructive hover:bg-destructive/10"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      ))}

      <Dialog
        open={shipTarget !== null}
        onOpenChange={(open) => {
          if (!open) setShipTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as shipped</DialogTitle>
            <DialogDescription>
              Optional, but the courier and tracking number show up on the
              customer&apos;s order timeline — fewer &ldquo;where is my
              order?&rdquo; messages.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleShip} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ship-courier">Courier</Label>
              <Input
                id="ship-courier"
                name="courier"
                placeholder="e.g., Delhivery, India Post"
                defaultValue={shipTarget?.tracking_courier ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ship-tracking">Tracking number</Label>
              <Input
                id="ship-tracking"
                name="tracking"
                placeholder="e.g., DL123456789IN"
                defaultValue={shipTarget?.tracking_number ?? ""}
              />
            </div>
            <div className="flex justify-end gap-2">
              <DialogClose render={<Button variant="outline" />}>
                Cancel
              </DialogClose>
              <Button type="submit" disabled={shipping}>
                {shipping && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Mark as shipped
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
