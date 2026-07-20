"use client";

import { logWhatsAppEvent } from "@/actions/whatsapp-log";
import type { WhatsAppLogKind } from "@/types";

/**
 * Anchor that records the outgoing WhatsApp message in the audit log
 * (fire-and-forget) as it opens. Used for customer-side wa.me CTAs rendered
 * by server components.
 */
export function WhatsAppLink({
  href,
  kind,
  logMessage,
  productId,
  className,
  children,
}: {
  href: string;
  kind: WhatsAppLogKind;
  logMessage: string;
  productId?: string | null;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => {
        logWhatsAppEvent(kind, logMessage, productId).catch(() => {});
      }}
    >
      {children}
    </a>
  );
}
