"use server";

import { getCurrentProfile } from "@/lib/auth-guard";
import { actionSuccess } from "@/lib/api/response";
import { getLoyaltyBalance, getLoyaltySettings } from "@/lib/loyalty";
import type { Profile } from "@/types";

export interface CheckoutStatus {
  profile: Profile | null;
  loyaltyBalance: number;
  pointValueInr: number;
}

export async function getCheckoutProfileStatus() {
  const profile = await getCurrentProfile();
  const [loyaltyBalance, settings] = await Promise.all([
    profile ? getLoyaltyBalance(profile.id) : Promise.resolve(0),
    getLoyaltySettings(),
  ]);
  return actionSuccess<CheckoutStatus>("", {
    profile,
    loyaltyBalance,
    pointValueInr: settings.point_value_inr,
  });
}
