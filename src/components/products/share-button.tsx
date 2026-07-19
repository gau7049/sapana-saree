"use client";

import { useState } from "react";
import { Link as LinkIcon, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/shared/icons";
import { buildProductShareUrl } from "@/lib/whatsapp";
import { logWhatsAppEvent } from "@/actions/whatsapp-log";
import { useOrigin } from "@/hooks/use-origin";

/**
 * Word-of-mouth is how sarees sell — most purchases start with a share in a
 * family WhatsApp group. This makes that share one tap from the product page.
 *
 * Signed-in customers share links carrying their referral code (?ref=…): if
 * the friend signs up and completes an order, the sharer earns referral
 * points. The proxy stores the code in a cookie so it survives browsing.
 */
export function ShareButton({
  title,
  price,
  slug,
  referralCode = null,
}: {
  title: string;
  price: number;
  slug: string;
  referralCode?: string | null;
}) {
  const [copied, setCopied] = useState(false);
  const origin = useOrigin();

  const productUrl = `${origin}/sarees/${slug}${
    referralCode ? `?ref=${encodeURIComponent(referralCode)}` : ""
  }`;

  // navigator.share is typed as always-present but is undefined outside
  // secure contexts / desktop browsers — feature-detect at runtime.
  const canNativeShare = () => typeof navigator.share === "function";

  function logShare() {
    logWhatsAppEvent(
      "share",
      `${title} — ₹${price.toLocaleString("en-IN")} — ${productUrl}`
    ).catch(() => {});
  }

  async function handleNativeShare() {
    logShare();
    try {
      await navigator.share({
        title,
        text: `${title} — ₹${price.toLocaleString("en-IN")}`,
        url: productUrl,
      });
    } catch {
      // User dismissed the sheet — nothing to do.
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(productUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (e.g. insecure context) — ignore.
    }
  }

  return (
    <div className="flex gap-2">
      <a
        href={buildProductShareUrl(title, price, productUrl)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border text-sm font-medium transition-colors hover:bg-[#25D366]/10 hover:text-[#25D366]"
        onClick={(e) => {
          // If the OS share sheet exists, use it instead of the wa.me link.
          if (canNativeShare()) {
            e.preventDefault();
            handleNativeShare();
          } else {
            logShare();
          }
        }}
      >
        <WhatsAppIcon className="h-4 w-4" />
        Share with family &amp; friends
      </a>
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Copy product link"
        title="Copy link"
        onClick={handleCopy}
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-600" />
        ) : (
          <LinkIcon className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
