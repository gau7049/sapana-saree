import { createMetadata } from "@/lib/seo";
import { getCurrentProfile } from "@/lib/auth-guard";
import { ProfileForm } from "@/components/shared/profile-form";
import { LoyaltyCard } from "@/components/shared/loyalty-card";
import {
  getLoyaltyBalance,
  getLoyaltySettings,
  ensureReferralCode,
} from "@/lib/loyalty";
import { getUserLoyaltyTransactions } from "@/lib/queries/loyalty";

export const metadata = createMetadata({
  title: "My Account",
  description: "Manage your Sapana Saree account",
  path: "/account",
});

export default async function AccountPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const [balance, settings, transactions, referralCode] = await Promise.all([
    getLoyaltyBalance(profile.id),
    getLoyaltySettings(),
    getUserLoyaltyTransactions(profile.id, 5),
    // Lazy init covers accounts created before referral codes existed.
    profile.referral_code ?? ensureReferralCode(profile.id),
  ]);

  return (
    <div className="space-y-6">
      <ProfileForm
        username={profile.username}
        fullName={profile.full_name ?? ""}
      />
      <LoyaltyCard
        balance={balance}
        pointValueInr={settings.point_value_inr}
        referralCode={referralCode}
        referralPoints={settings.referral_points}
        transactions={transactions}
      />
    </div>
  );
}
