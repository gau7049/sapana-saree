import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth-guard";
import { AccountTabs } from "@/components/shared/account-tabs";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?redirect=/account");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        My Account
      </h1>

      <AccountTabs />

      <div className="mt-6">{children}</div>
    </div>
  );
}
