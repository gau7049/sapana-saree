import { Suspense } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { Users } from "lucide-react";
import { AdminUsersToolbar } from "@/components/admin/admin-users-toolbar";
import { AdminUsersList } from "@/components/admin/admin-users-list";
import { getAdminUsers } from "@/lib/queries/users";

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function AdminUsersPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.page) || 1;

  const { users, total, totalPages } = await getAdminUsers({
    search: params.search,
    page,
  });

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-sm text-muted-foreground">
          {total} {total === 1 ? "registered customer" : "registered customers"}
        </p>
      </div>

      <div className="mt-6">
        <Suspense>
          <AdminUsersToolbar />
        </Suspense>
      </div>

      {users.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={Users}
            title={params.search ? "No matching users" : "No users yet"}
            description={
              params.search
                ? "Try a different search."
                : "Registered customers will appear here."
            }
          />
        </div>
      ) : (
        <>
          <div className="mt-4">
            <AdminUsersList users={users} />
          </div>

          <div className="mt-6">
            <Suspense>
              <Pagination currentPage={page} totalPages={totalPages} basePath="/admin/users" />
            </Suspense>
          </div>
        </>
      )}
    </div>
  );
}
