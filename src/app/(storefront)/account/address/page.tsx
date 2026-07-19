import { createMetadata } from "@/lib/seo";
import { getCurrentProfile } from "@/lib/auth-guard";
import { AddressForm } from "@/components/shared/address-form";

export const metadata = createMetadata({
  title: "Address",
  description: "Manage your Sapana Saree shipping address",
  path: "/account/address",
});

export default async function AddressPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  return (
    <AddressForm
      addressLine1={profile.address_line1 ?? ""}
      addressLine2={profile.address_line2 ?? ""}
      city={profile.city ?? ""}
      state={profile.state ?? ""}
      country={profile.country ?? ""}
      postalCode={profile.postal_code ?? ""}
      phone={profile.phone ?? ""}
    />
  );
}
