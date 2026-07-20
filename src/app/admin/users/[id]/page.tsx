import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { AdminUserActions } from "@/components/admin/admin-user-actions";
import { AdminPointsAdjust } from "@/components/admin/admin-points-adjust";
import { Coins, Package } from "lucide-react";
import { getAdminUserDetail } from "@/lib/queries/users";

interface Props {
  params: Promise<{ id: string }>;
}

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

export default async function AdminUserDetailPage({ params }: Props) {
  const { id } = await params;
  const detail = await getAdminUserDetail(id);
  if (!detail) notFound();

  const { profile, transactions, pointsBalance, orders, referredByUsername, referralCount } = detail;

  const address = [
    profile.address_line1,
    profile.address_line2,
    [profile.city, profile.state, profile.postal_code].filter(Boolean).join(", "),
    profile.country,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div>
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Users
      </Link>

      <div className="mt-3 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{profile.full_name ?? profile.username}</h1>
          <p className="text-sm text-muted-foreground">@{profile.username}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant="secondary"
            className={
              profile.is_active
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
            }
          >
            {profile.is_active ? "Active" : "Deactivated"}
          </Badge>
          {profile.role === "customer" && (
            <AdminUserActions
              userId={profile.id}
              userName={profile.full_name ?? profile.username}
              isActive={profile.is_active}
            />
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phone</span>
              <span className="font-medium">{profile.phone ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Address</span>
              <span className="max-w-[60%] text-right font-medium">{address || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Role</span>
              <span className="font-medium capitalize">{profile.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Referral code</span>
              <span className="font-medium">{profile.referral_code ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Referred by</span>
              <span className="font-medium">
                {referredByUsername ? `@${referredByUsername}` : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Referrals made</span>
              <span className="font-medium">{referralCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Joined</span>
              <span className="font-medium">{formatDate(profile.created_at)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
            <div>
              <CardTitle>Loyalty points</CardTitle>
              <CardDescription>Current balance: {pointsBalance} points</CardDescription>
            </div>
            <AdminPointsAdjust userId={profile.id} pointsBalance={pointsBalance} />
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <EmptyState
                icon={Coins}
                title="No transactions yet"
                description="Point activity will appear here."
              />
            ) : (
              <div className="divide-y">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium">{TX_LABEL[tx.type] ?? tx.type}</p>
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
                      <p className="text-xs text-muted-foreground">{formatDate(tx.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Order history</CardTitle>
          <CardDescription>{orders.length} orders placed via WhatsApp</CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No orders yet"
              description="Orders placed through WhatsApp will appear here."
            />
          ) : (
            <div className="divide-y">
              {orders.map((order) => (
                <div key={order.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium">{order.product?.title ?? "Unknown product"}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.product ? `₹${Number(order.product.price).toLocaleString("en-IN")}` : ""}
                      {order.paymentMethod ? ` · ${order.paymentMethod === "cod" ? "COD" : "Online"}` : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <Badge variant="secondary">{order.status}</Badge>
                    <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
