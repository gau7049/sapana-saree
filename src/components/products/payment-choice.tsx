"use client";

import { useState } from "react";
import { Banknote, Smartphone, Coins } from "lucide-react";
import { COD_CHARGE } from "@/lib/constants";
import { OrderTerms } from "./order-terms";
import type { PaymentMethod } from "@/types";

export interface LoyaltyRedeemInfo {
  balance: number;
  pointValueInr: number;
}

/**
 * One-tap payment preference, captured before the WhatsApp handoff so the
 * chat starts with the choice (and the order terms) already stated in the
 * customer's own message — no back-and-forth, no surprises about the COD
 * charge, and written proof the conditions were accepted.
 *
 * When the customer has loyalty points, they can choose how many to redeem
 * here; the redemption is validated server-side against the ledger.
 */
export function PaymentChoice({
  onSelect,
  disabled = false,
  loyalty,
  price,
}: {
  onSelect: (method: PaymentMethod, pointsToRedeem: number) => void;
  disabled?: boolean;
  loyalty?: LoyaltyRedeemInfo | null;
  price?: number;
}) {
  const [pointsInput, setPointsInput] = useState("");

  const balance = loyalty?.balance ?? 0;
  const pointValue = loyalty?.pointValueInr ?? 1;
  // Never let a redemption exceed the order value.
  const maxByPrice = price ? Math.floor(price / pointValue) : balance;
  const maxRedeemable = Math.max(0, Math.min(balance, maxByPrice));

  const parsed = Math.floor(Number(pointsInput) || 0);
  const pointsToRedeem = Math.max(0, Math.min(parsed, maxRedeemable));
  const discount = Math.round(pointsToRedeem * pointValue);

  return (
    <div className="space-y-4">
      {maxRedeemable > 0 && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Coins className="h-4 w-4 text-primary" />
            You have {balance} loyalty points (worth ₹
            {Math.round(balance * pointValue).toLocaleString("en-IN")})
          </div>
          <div className="mt-2 flex items-center gap-2">
            <label htmlFor="redeem-points" className="text-xs text-muted-foreground">
              Points to use:
            </label>
            {/* Native input on purpose: the Base UI wrapper doesn't surface
                change events reliably for controlled values. */}
            <input
              id="redeem-points"
              type="number"
              min={0}
              max={maxRedeemable}
              value={pointsInput}
              onChange={(e) => setPointsInput(e.target.value)}
              placeholder="0"
              className="h-8 w-24 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            <button
              type="button"
              onClick={() => setPointsInput(String(maxRedeemable))}
              className="text-xs font-medium text-primary hover:underline"
            >
              Use all {maxRedeemable}
            </button>
          </div>
          {pointsToRedeem > 0 && (
            <p className="mt-1.5 text-xs text-green-700 dark:text-green-400">
              −₹{discount.toLocaleString("en-IN")} off this order
              {price
                ? ` — payable ₹${Math.max(0, price - discount).toLocaleString("en-IN")}`
                : ""}
            </p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onSelect("online", pointsToRedeem)}
          className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:border-primary/50 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Smartphone className="h-5 w-5 shrink-0 text-primary" />
          <span>
            <span className="block text-sm font-medium">Online payment</span>
            <span className="block text-xs text-muted-foreground">
              UPI or bank transfer — details shared on WhatsApp
            </span>
          </span>
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onSelect("cod", pointsToRedeem)}
          className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:border-primary/50 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Banknote className="h-5 w-5 shrink-0 text-primary" />
          <span>
            <span className="block text-sm font-medium">
              Cash on Delivery{" "}
              <span className="font-normal text-muted-foreground">
                (+₹{COD_CHARGE} handling charge)
              </span>
            </span>
            <span className="block text-xs text-muted-foreground">
              ₹{COD_CHARGE} handling charge collected upfront; rest paid on delivery
            </span>
          </span>
        </button>
      </div>

      <OrderTerms compact />
    </div>
  );
}
