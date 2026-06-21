import { redirect } from "next/navigation";
import { createMetadata } from "@/lib/seo";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/shared/profile-form";

export const metadata = createMetadata({
  title: "My Account",
  description: "Manage your Sapana Saree account",
  path: "/account",
});

export default async function AccountPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/account");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        My Account
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Member since{" "}
        {new Date(user.created_at).toLocaleDateString("en-IN", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>

      <div className="mt-8">
        <ProfileForm
          email={user.email ?? ""}
          fullName={profile?.full_name ?? ""}
          phone={profile?.phone ?? ""}
        />
      </div>
    </div>
  );
}
