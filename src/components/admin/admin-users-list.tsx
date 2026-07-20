import { Badge } from "@/components/ui/badge";
import { AdminUserActions } from "@/components/admin/admin-user-actions";
import type { AdminUserRow } from "@/lib/queries/users";

export function AdminUsersList({ users }: { users: AdminUserRow[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
            <th className="p-3 font-medium">Customer</th>
            <th className="p-3 font-medium">Phone</th>
            <th className="p-3 font-medium">City</th>
            <th className="p-3 text-right font-medium">Points</th>
            <th className="p-3 text-right font-medium">Orders</th>
            <th className="p-3 font-medium">Status</th>
            <th className="p-3 font-medium">Joined</th>
            <th className="p-3" />
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b last:border-0">
              <td className="p-3">
                <span className="font-medium">{user.fullName ?? user.username}</span>{" "}
                <span className="text-xs text-muted-foreground">@{user.username}</span>
              </td>
              <td className="p-3 text-muted-foreground">{user.phone ?? "—"}</td>
              <td className="p-3 text-muted-foreground">{user.city ?? "—"}</td>
              <td className="p-3 text-right font-semibold">{user.pointsBalance}</td>
              <td className="p-3 text-right text-muted-foreground">{user.orderCount}</td>
              <td className="p-3">
                <Badge
                  variant="secondary"
                  className={
                    user.isActive
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                  }
                >
                  {user.isActive ? "Active" : "Deactivated"}
                </Badge>
              </td>
              <td className="p-3 text-muted-foreground">
                {new Date(user.createdAt).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </td>
              <td className="p-3">
                <AdminUserActions
                  userId={user.id}
                  userName={user.fullName ?? user.username}
                  isActive={user.isActive}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
