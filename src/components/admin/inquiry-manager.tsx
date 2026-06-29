"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { updateInquiryStatus } from "@/actions/inquiries";
import { handleAction } from "@/lib/action-handler";
import type { InquiryStatus } from "@/types";

interface InquiryRow {
  id: string;
  status: string;
  whatsapp_message: string;
  notes: string | null;
  created_at: string;
  profiles: { full_name: string | null; email: string; phone: string | null } | null;
  products: { title: string; slug: string; price: number } | null;
}

const STATUS_STYLE: Record<string, string> = {
  sent: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  responded: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const NEXT_STATUS: Record<string, InquiryStatus> = {
  sent: "responded",
  responded: "completed",
};

export function InquiryManager({ inquiries }: { inquiries: InquiryRow[] }) {
  const router = useRouter();

  async function handleStatusChange(id: string, status: InquiryStatus) {
    await handleAction(updateInquiryStatus(id, status), {
      onSuccess: () => router.refresh(),
    });
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
                {inquiry.profiles?.full_name ?? inquiry.profiles?.email ?? "Unknown"}
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

          {inquiry.notes && (
            <p className="mt-2 rounded bg-muted p-2 text-sm">
              <span className="font-medium">Notes: </span>
              {inquiry.notes}
            </p>
          )}

          <div className="mt-3 flex gap-2">
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
            {inquiry.status !== "cancelled" && inquiry.status !== "completed" && (
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
    </div>
  );
}
