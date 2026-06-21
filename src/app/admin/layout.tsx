import { AdminSidebar, AdminMobileNav } from "@/components/admin/admin-sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex flex-1 flex-col">
        <AdminMobileNav />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
