import { InquiryManager } from "@/components/admin/inquiry-manager";
import { EmptyState } from "@/components/shared/empty-state";
import { MessageCircle } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase/helpers";

async function getAdminInquiries() {
  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { data } = await supabase
        .from("inquiries")
        .select(
          "*, profiles(full_name, email, phone), products(title, slug, price)"
        )
        .order("created_at", { ascending: false });
      if (data) return data;
    } catch {}
  }
  return [];
}

export default async function AdminInquiriesPage() {
  const inquiries = await getAdminInquiries();

  return (
    <div>
      <h1 className="text-2xl font-bold">Inquiries</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Track WhatsApp order inquiries.
      </p>

      <div className="mt-6">
        {!inquiries || inquiries.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title="No inquiries yet"
            description="Customer inquiries will appear here when they click Buy Now."
          />
        ) : (
          <InquiryManager inquiries={inquiries} />
        )}
      </div>
    </div>
  );
}
