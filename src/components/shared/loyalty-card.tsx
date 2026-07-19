"use client";

import { useState } from "react";
import { Coins, Copy, Check, Share2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SITE_URL } from "@/lib/constants";
import type { LoyaltyTransaction } from "@/types";

const TX_LABEL: Record<string, string> = {
  welcome: "Welcome bonus",
  review: "Review reward",
  review_revoked: "Review removed",
  referral: "Friend's first order delivered",
  orders_milestone: "Loyal customer bonus",
  redeemed: "Redeemed on an order",
  redemption_refund: "Points returned (order cancelled)",
  adjustment: "Adjustment",
};

export function LoyaltyCard({
  balance,
  pointValueInr,
  referralCode,
  referralPoints,
  transactions,
}: {
  balance: number;
  pointValueInr: number;
  referralCode: string | null;
  referralPoints: number;
  transactions: LoyaltyTransaction[];
}) {
  const [copied, setCopied] = useState(false);
  const referralLink = referralCode
    ? `${SITE_URL}/?ref=${encodeURIComponent(referralCode)}`
    : null;

  async function copyReferralLink() {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — ignore.
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-4 w-4 text-primary" />
          Loyalty Points
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-3xl font-bold">{balance}</p>
          <p className="text-sm text-muted-foreground">
            points · worth ₹
            {Math.round(balance * pointValueInr).toLocaleString("en-IN")} on your
            next order
          </p>
        </div>

        {referralCode && (
          <div className="rounded-lg border bg-muted/40 p-3">
            <p className="flex items-center gap-1.5 text-sm font-medium">
              <Share2 className="h-3.5 w-3.5" />
              Your referral code:{" "}
              <span className="font-mono text-primary">{referralCode}</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Share your link — you earn {referralPoints} points when a friend
              signs up and their first order is delivered.
            </p>
            <button
              type="button"
              onClick={copyReferralLink}
              className="mt-2 inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium hover:bg-accent"
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-600" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
              {copied ? "Copied!" : "Copy referral link"}
            </button>
          </div>
        )}

        {transactions.length > 0 && (
          <div>
            <p className="text-sm font-medium">Recent activity</p>
            <div className="mt-1.5 divide-y">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-1.5 text-sm"
                >
                  <span className="text-muted-foreground">
                    {TX_LABEL[tx.type] ?? tx.type}
                  </span>
                  <span
                    className={
                      tx.points >= 0
                        ? "font-medium text-green-600 dark:text-green-400"
                        : "font-medium text-red-600 dark:text-red-400"
                    }
                  >
                    {tx.points >= 0 ? `+${tx.points}` : tx.points}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Earn points with every delivered order, by reviewing sarees you
          bought, and by referring friends. Redeem them on any order at
          checkout.
        </p>
      </CardContent>
    </Card>
  );
}
