import { redirect } from "next/navigation";
import {
  AdminSidebar,
  AdminMobileNav,
} from "@/components/admin/admin-sidebar";
import { requireAdmin } from "@/lib/auth-guard";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireAdmin();
  } catch {
    redirect("/login?redirect=/admin");
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex flex-1 flex-col">
        <AdminMobileNav />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
