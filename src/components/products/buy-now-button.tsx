"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MessageCircle } from "lucide-react";
import { buildWhatsAppUrl, buildWhatsAppMessage, type WhatsAppInquiry } from "@/lib/whatsapp";
import { toast } from "sonner";
import { createInquiry } from "@/actions/inquiries";
import { isReadyForCheckout, hasSavedAddress } from "@/lib/profile-helpers";
import { CheckoutModal } from "@/components/products/checkout-modal";
import {
  PaymentChoice,
  type LoyaltyRedeemInfo,
} from "@/components/products/payment-choice";
import type { ProductWithImages, Profile, PaymentMethod } from "@/types";

function buildInquiryDetails(
  product: ProductWithImages,
  profile: Profile,
  paymentMethod: PaymentMethod,
  pointsRedeemed: number,
  pointValueInr: number
): WhatsAppInquiry {
  return {
    productTitle: product.title,
    productId: product.id,
    category: product.categories?.name ?? "Uncategorized",
    price: product.price,
    userName: profile.full_name ?? profile.username,
    userPhone: profile.phone ?? undefined,
    userEmail: profile.email ?? undefined,
    paymentMethod,
    pointsRedeemed,
    pointValueInr,
    address: hasSavedAddress(profile)
      ? {
          line1: profile.address_line1 ?? "",
          line2: profile.address_line2,
          city: profile.city ?? "",
          state: profile.state ?? "",
          country: profile.country ?? "",
          postalCode: profile.postal_code ?? "",
        }
      : undefined,
  };
}

export function BuyNowButton({
  product,
  profile,
  loyalty = null,
}: {
  product: ProductWithImages;
  profile: Profile | null;
  loyalty?: LoyaltyRedeemInfo | null;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function fireWhatsApp(
    p: Profile,
    paymentMethod: PaymentMethod,
    pointsRedeemed: number,
    pointValueInr: number
  ) {
    const details = buildInquiryDetails(
      product,
      p,
      paymentMethod,
      pointsRedeemed,
      pointValueInr
    );
    // Log the inquiry in the background — never let a DB hiccup block the
    // actual WhatsApp handoff, which is the real conversion action.
    createInquiry(
      product.id,
      buildWhatsAppMessage(details),
      paymentMethod,
      pointsRedeemed
    ).catch(() => {});
    window.open(buildWhatsAppUrl(details), "_blank");
    toast.success("Opening WhatsApp...");
  }

  useEffect(() => {
    if (searchParams.get("checkout_verified") !== "1") return;

    const params = new URLSearchParams(searchParams.toString());
    params.delete("checkout_verified");
    router.replace(params.size ? `${pathname}?${params}` : pathname);

    if (profile && profile.email_verified) {
      toast.success(profile.full_name ? "Email verified" : "Login Successful");
      if (isReadyForCheckout(profile)) {
        // Resume with the payment step — window.open needs a user gesture
        // anyway, so auto-firing here would be popup-blocked.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPaymentOpen(true);
        return;
      }
    }
    // One-time mount effect resuming a checkout flow from the magic-link redirect's
    // query marker — not a derived-state sync, so the direct setState here is intentional.
    setModalOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleBuyNow() {
    if (profile && isReadyForCheckout(profile)) {
      setPaymentOpen(true);
    } else {
      setModalOpen(true);
    }
  }

  return (
    <>
      <Button size="lg" className="w-full gap-2" onClick={handleBuyNow}>
        <MessageCircle className="h-5 w-5" />
        {product.is_available ? "Buy Now via WhatsApp" : "Ask About Restock"}
      </Button>

      {/* Repeat buyers with a complete profile: pick payment (and points to
          redeem), then straight to WhatsApp — the click on a payment option is
          the user gesture that keeps window.open from being popup-blocked. */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>How would you like to pay?</DialogTitle>
          </DialogHeader>
          <PaymentChoice
            loyalty={loyalty}
            price={product.price}
            onSelect={(method, points) => {
              setPaymentOpen(false);
              if (profile) {
                fireWhatsApp(profile, method, points, loyalty?.pointValueInr ?? 1);
              }
            }}
          />
        </DialogContent>
      </Dialog>

      <CheckoutModal
        open={modalOpen}
        profile={profile}
        price={product.price}
        onClose={() => setModalOpen(false)}
        onComplete={(finalProfile, method, points, pointValueInr) => {
          setModalOpen(false);
          fireWhatsApp(finalProfile, method, points, pointValueInr);
          router.refresh();
        }}
      />
    </>
  );
}
