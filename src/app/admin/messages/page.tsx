import { EmptyState } from "@/components/shared/empty-state";
import { Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { isSupabaseConfigured } from "@/lib/supabase/helpers";

async function getAdminMessages() {
  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { data } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) return data;
    } catch {}
  }
  return [];
}

export default async function AdminMessagesPage() {
  const messages = await getAdminMessages();

  return (
    <div>
      <h1 className="text-2xl font-bold">Messages</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Contact form submissions from customers.
      </p>

      <div className="mt-6">
        {!messages || messages.length === 0 ? (
          <EmptyState
            icon={Mail}
            title="No messages yet"
            description="Messages from the contact form will appear here."
          />
        ) : (
          <div className="space-y-3">
            {messages.map(
              (msg: {
                id: string;
                name: string;
                email: string;
                subject: string | null;
                message: string;
                is_read: boolean;
                created_at: string;
              }) => (
                <div
                  key={msg.id}
                  className="rounded-lg border bg-card p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{msg.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {msg.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!msg.is_read && <Badge>New</Badge>}
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.created_at).toLocaleDateString("en-IN")}
                      </span>
                    </div>
                  </div>
                  {msg.subject && (
                    <p className="mt-2 text-sm font-medium">{msg.subject}</p>
                  )}
                  <p className="mt-1 text-sm text-muted-foreground">
                    {msg.message}
                  </p>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
