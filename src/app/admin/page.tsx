import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, MessageCircle, Star, Users } from "lucide-react";
import { getDashboardStats } from "@/lib/queries/stats";
import { getAdminInquiries } from "@/lib/queries/inquiries";
import Link from "next/link";

export default async function AdminDashboard() {
  const [stats, inquiries] = await Promise.all([
    getDashboardStats(),
    getAdminInquiries(),
  ]);
  const recentInquiries = inquiries.slice(0, 5);

  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-1 text-muted-foreground">
        Overview of your store.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          icon={Package}
          href="/admin/products"
        />
        <StatCard
          title="Active Inquiries"
          value={stats.activeInquiries}
          icon={MessageCircle}
          href="/admin/inquiries"
        />
        <StatCard
          title="Pending Reviews"
          value={stats.pendingReviews}
          icon={Star}
          href="/admin/reviews"
        />
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          href="/admin/settings"
        />
      </div>

      {recentInquiries.length > 0 && (
        <div className="mt-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Inquiries</CardTitle>
              <Link
                href="/admin/inquiries"
                className="text-sm font-medium text-primary hover:underline"
              >
                View all
              </Link>
            </CardHeader>
            <CardContent className="divide-y">
              {recentInquiries.map((inquiry) => (
                <div
                  key={inquiry.id}
                  className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {inquiry.products?.title ?? "Unknown product"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {inquiry.profiles?.full_name ??
                        inquiry.profiles?.username ??
                        "Unknown customer"}{" "}
                      ·{" "}
                      {new Date(inquiry.created_at).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    {inquiry.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Link
              href="/admin/products/new"
              className="rounded-lg border bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Add Product
            </Link>
            <Link
              href="/admin/categories"
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Manage Categories
            </Link>
            <Link
              href="/admin/reviews"
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Moderate Reviews
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  href,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="flex items-center gap-4 p-6">
          <div className="rounded-full bg-primary/10 p-3">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
