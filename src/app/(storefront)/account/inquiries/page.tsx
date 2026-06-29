import { redirect } from "next/navigation";
import { createMetadata } from "@/lib/seo";
import { isSupabaseConfigured } from "@/lib/supabase/helpers";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { MessageCircle } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export const metadata = createMetadata({
  title: "My Inquiries",
  description: "View your WhatsApp inquiry history",
  path: "/account/inquiries",
});

const STATUS_COLORS: Record<string, string> = {
  sent: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  responded: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

export default async function InquiriesPage() {
  if (!isSupabaseConfigured()) {
    redirect("/login?redirect=/account/inquiries");
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/account/inquiries");

  const { data: inquiries } = await supabase
    .from("inquiries")
    .select("*, products(title, slug, price)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        My Inquiries
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Track your WhatsApp order inquiries
      </p>

      <div className="mt-8 space-y-4">
        {!inquiries || inquiries.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title="No inquiries yet"
            description="When you click 'Buy Now' on a product, your inquiry will appear here."
          >
            <Link href="/sarees" className={buttonVariants()}>
              Browse Sarees
            </Link>
          </EmptyState>
        ) : (
          inquiries.map((inquiry) => (
            <div
              key={inquiry.id}
              className="rounded-xl border bg-card p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <Link
                    href={`/sarees/${(inquiry.products as { slug: string })?.slug}`}
                    className="font-medium hover:text-primary"
                  >
                    {(inquiry.products as { title: string })?.title}
                  </Link>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    ₹{Number((inquiry.products as { price: number })?.price).toLocaleString("en-IN")}
                  </p>
                </div>
                <Badge
                  className={STATUS_COLORS[inquiry.status] ?? ""}
                  variant="secondary"
                >
                  {inquiry.status}
                </Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {new Date(inquiry.created_at).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
