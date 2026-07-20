import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Coins, Users } from "lucide-react";
import { LoyaltySettingsForm } from "@/components/admin/loyalty-settings-form";
import { getLoyaltySettings } from "@/lib/loyalty";
import {
  getCustomerLoyaltySummaries,
  getRecentLoyaltyTransactions,
  getReferralHistory,
} from "@/lib/queries/loyalty";

const TX_LABEL: Record<string, string> = {
  welcome: "Welcome bonus",
  review: "Review reward",
  review_revoked: "Review removed",
  referral: "Referral reward",
  orders_milestone: "Orders milestone",
  redeemed: "Redeemed at checkout",
  redemption_refund: "Refund (order cancelled)",
  adjustment: "Manual adjustment",
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function AdminLoyaltyPage() {
  const [settings, customers, transactions, referrals] = await Promise.all([
    getLoyaltySettings(),
    getCustomerLoyaltySummaries(),
    getRecentLoyaltyTransactions(),
    getReferralHistory(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold">Loyalty &amp; Referrals</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Point balances, transaction history, referral tracking, and program settings.
      </p>

      <div className="mt-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Program settings</CardTitle>
            <CardDescription>
              Changes apply immediately to future earnings and redemptions —
              existing balances are never rewritten.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoyaltySettingsForm settings={settings} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer balances</CardTitle>
            <CardDescription>
              Balance = lifetime earned − redeemed. The balance is also shown on
              each inquiry so you can apply redemptions in chat.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {customers.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No customers yet"
                description="Customer point balances will appear here."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="pb-2 pr-4 font-medium">Customer</th>
                      <th className="pb-2 pr-4 text-right font-medium">Balance</th>
                      <th className="pb-2 pr-4 text-right font-medium">Earned</th>
                      <th className="pb-2 text-right font-medium">Redeemed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((customer) => (
                      <tr key={customer.userId} className="border-b last:border-0">
                        <td className="py-2 pr-4">
                          <Link
                            href={`/admin/users/${customer.userId}`}
                            className="font-medium hover:underline"
                          >
                            {customer.fullName ?? customer.username}
                          </Link>{" "}
                          <span className="text-xs text-muted-foreground">
                            @{customer.username}
                          </span>
                        </td>
                        <td className="py-2 pr-4 text-right font-semibold">
                          {customer.balance}
                        </td>
                        <td className="py-2 pr-4 text-right text-muted-foreground">
                          {customer.earned}
                        </td>
                        <td className="py-2 text-right text-muted-foreground">
                          {customer.redeemed}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent transactions</CardTitle>
            <CardDescription>Every point earned, redeemed, or revoked.</CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <EmptyState
                icon={Coins}
                title="No transactions yet"
                description="Point activity will appear here as customers earn and redeem."
              />
            ) : (
              <div className="divide-y">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between gap-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">
                        {TX_LABEL[tx.type] ?? tx.type}
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          @{tx.profiles?.username ?? "unknown"}
                        </span>
                      </p>
                      {tx.note && (
                        <p className="truncate text-xs text-muted-foreground">{tx.note}</p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p
                        className={
                          tx.points >= 0
                            ? "font-semibold text-green-600 dark:text-green-400"
                            : "font-semibold text-red-600 dark:text-red-400"
                        }
                      >
                        {tx.points >= 0 ? `+${tx.points}` : tx.points}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(tx.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Referral history</CardTitle>
            <CardDescription>
              Who referred whom. &ldquo;Pending&rdquo; flips to
              &ldquo;rewarded&rdquo; when the referred customer&apos;s first order
              is delivered.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {referrals.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No referrals yet"
                description="Referrals appear when customers share products with their referral link."
              />
            ) : (
              <div className="divide-y">
                {referrals.map((referral) => (
                  <div
                    key={referral.id}
                    className="flex items-center justify-between gap-3 py-2 text-sm"
                  >
                    <p className="min-w-0 truncate">
                      <span className="font-medium">
                        @{referral.referrer?.username ?? "unknown"}
                      </span>{" "}
                      referred{" "}
                      <span className="font-medium">
                        @{referral.referred?.username ?? "unknown"}
                      </span>
                    </p>
                    <div className="flex shrink-0 items-center gap-3">
                      <Badge
                        variant="secondary"
                        className={
                          referral.status === "rewarded"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                        }
                      >
                        {referral.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(referral.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
