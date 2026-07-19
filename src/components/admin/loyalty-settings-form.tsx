"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { updateLoyaltySettings } from "@/actions/loyalty";
import { handleAction } from "@/lib/action-handler";
import type { LoyaltySettings } from "@/types";

const FIELDS: {
  name: keyof Omit<LoyaltySettings, "id" | "updated_at">;
  label: string;
  hint: string;
  step?: string;
}[] = [
  { name: "welcome_points", label: "Welcome points", hint: "On first registration" },
  { name: "review_points", label: "Review points", hint: "Per approved review" },
  {
    name: "review_min_rating",
    label: "Minimum review rating",
    hint: "Stars needed to earn review points",
  },
  { name: "referral_points", label: "Referral points", hint: "When a referred friend's first order is delivered" },
  {
    name: "orders_milestone_count",
    label: "Orders per milestone",
    hint: "Delivered orders needed for a bonus",
  },
  {
    name: "orders_milestone_points",
    label: "Milestone points",
    hint: "Bonus per milestone reached",
  },
  {
    name: "point_value_inr",
    label: "Point value (₹)",
    hint: "Rupee value of 1 point at checkout",
    step: "0.5",
  },
];

export function LoyaltySettingsForm({
  settings,
}: {
  settings: Omit<LoyaltySettings, "id" | "updated_at">;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    await handleAction(updateLoyaltySettings(new FormData(e.currentTarget)), {
      onSuccess: () => router.refresh(),
    });
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FIELDS.map((field) => (
          <div key={field.name} className="space-y-1.5">
            <Label htmlFor={`loyalty-${field.name}`}>{field.label}</Label>
            <Input
              id={`loyalty-${field.name}`}
              name={field.name}
              type="number"
              min="0"
              step={field.step ?? "1"}
              defaultValue={String(settings[field.name])}
              required
            />
            <p className="text-xs text-muted-foreground">{field.hint}</p>
          </div>
        ))}
      </div>
      <Button type="submit" disabled={saving}>
        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save settings
      </Button>
    </form>
  );
}
