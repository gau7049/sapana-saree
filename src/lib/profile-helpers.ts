import type { Profile } from "@/types";

export function hasSavedAddress(
  p: Pick<Profile, "address_line1" | "city" | "state" | "postal_code" | "phone">
): boolean {
  return !!(
    p.address_line1?.trim() &&
    p.city?.trim() &&
    p.state?.trim() &&
    p.postal_code?.trim() &&
    p.phone?.trim()
  );
}

// Gate used before "Buy Now": a full name + address is required so the
// WhatsApp order message always has everything needed to fulfill it.
export function isReadyForCheckout(p: Profile): boolean {
  return !!p.full_name?.trim() && hasSavedAddress(p);
}
