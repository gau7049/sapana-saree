import { redirect } from "next/navigation";
import {
  AdminSidebar,
  AdminMobileNav,
} from "@/components/admin/admin-sidebar";
import { isSupabaseConfigured } from "@/lib/supabase/helpers";
import { getLocalUser } from "@/actions/auth";

async function getAdminUser() {
  if (!isSupabaseConfigured()) {
    const localUser = await getLocalUser();
    if (localUser?.role === "admin") {
      return { isAdmin: true, isDemo: false };
    }
    return null;
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.role !== "admin" && profile.role !== "super_admin"))
      return null;

    return { isAdmin: true, isDemo: false };
  } catch {
    return null;
  }
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const adminUser = await getAdminUser();

  if (!adminUser) {
    redirect("/login?redirect=/admin");
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex flex-1 flex-col">
        <AdminMobileNav />
        <main className="flex-1 p-6">
          {adminUser.isDemo && (
            <div className="mb-6 rounded-lg border border-blue-300 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-200">
              <strong>Demo Mode:</strong> You&apos;re viewing the admin panel
              without logging in. Sign in with your admin credentials for full
              access. Configure Supabase in{" "}
              <code className="rounded bg-blue-100 px-1 dark:bg-blue-900">
                .env.local
              </code>{" "}
              for production use.
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
