"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/auth-guard";
import { createLogger } from "@/lib/logger";
import type { WhatsAppLogKind } from "@/types";

const logger = createLogger("whatsapp-log");

const VALID_KINDS: WhatsAppLogKind[] = [
  "order",
  "inquiry_reopen",
  "unboxing",
  "share",
  "support",
];

/**
 * Audit trail for system-generated WhatsApp messages. Fire-and-forget from
 * the client right before a wa.me link opens. wa.me links carry no delivery
 * receipts (that needs the WhatsApp Business API), so the status recorded is
 * that the link was generated/opened.
 */
export async function logWhatsAppEvent(kind: WhatsAppLogKind, message: string) {
  if (!VALID_KINDS.includes(kind) || !message) return;

  const profile = await getCurrentProfile().catch(() => null);

  const admin = createAdminClient();
  const { error } = await admin.from("whatsapp_logs").insert({
    user_id: profile?.id ?? null,
    kind,
    message: message.slice(0, 4000),
  });
  if (error) {
    logger.error("whatsapp log insert failed", { kind, error: error.message });
  }
}
