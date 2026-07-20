"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { MessageCircle, CheckCircle2 } from "lucide-react";
import { buildWhatsAppUrl, buildWhatsAppMessage, type WhatsAppInquiry } from "@/lib/whatsapp";
import { createInquiry } from "@/actions/inquiries";
import { isReadyForCheckout, hasSavedAddress } from "@/lib/profile-helpers";
import { CheckoutModal } from "@/components/products/checkout-modal";
import { useSelectedImage } from "@/components/products/selected-image-context";
import { ProgressiveImage } from "@/components/shared/progressive-image";
import { useOrigin } from "@/hooks/use-origin";
import {
  PaymentChoice,
  type LoyaltyRedeemInfo,
} from "@/components/products/payment-choice";
import type { ProductWithImages, Profile, PaymentMethod } from "@/types";

function buildInquiryDetails(
  product: ProductWithImages,
  origin: string,
  profile: Profile,
  paymentMethod: PaymentMethod,
  pointsRedeemed: number,
  pointValueInr: number,
  selectedVariant?: string,
  selectedImageUrl?: string
): WhatsAppInquiry {
  return {
    productTitle: product.title,
    productUrl: `${origin}/sarees/${product.slug}`,
    category: product.categories?.name ?? "Uncategorized",
    price: product.price,
    userName: profile.full_name ?? profile.username,
    userPhone: profile.phone ?? undefined,
    selectedVariant,
    selectedImageUrl,
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
  const [orderPlacedOpen, setOrderPlacedOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const router = useRouter();
  const origin = useOrigin();
  const { id: imageId, url: imageUrl, index, total, label } = useSelectedImage();

  function fireWhatsApp(
    p: Profile,
    paymentMethod: PaymentMethod,
    pointsRedeemed: number,
    pointValueInr: number
  ) {
    const selectedVariant =
      total > 1 ? `Image ${index + 1} of ${total}${label ? ` (${label})` : ""}` : undefined;
    const details = buildInquiryDetails(
      product,
      origin,
      p,
      paymentMethod,
      pointsRedeemed,
      pointValueInr,
      selectedVariant,
      total > 1 ? (imageUrl ?? undefined) : undefined
    );
    // Log the inquiry in the background — never let a DB hiccup block the
    // actual WhatsApp handoff, which is the real conversion action.
    createInquiry(
      product.id,
      buildWhatsAppMessage(details),
      paymentMethod,
      pointsRedeemed,
      total > 1 ? imageId : null
    ).catch(() => {});
    window.open(buildWhatsAppUrl(details), "_blank");
    setOrderPlacedOpen(true);
  }

  function proceedToCheckout() {
    if (profile && isReadyForCheckout(profile)) {
      setPaymentOpen(true);
    } else {
      setModalOpen(true);
    }
  }

  function handleBuyNow() {
    // Listings can bundle several sarees under one product — confirm which
    // photo the customer means before we hand off, so the admin doesn't have
    // to ask. Only relevant when there's more than one to pick from.
    if (total > 1) {
      setConfirmOpen(true);
    } else {
      proceedToCheckout();
    }
  }

  return (
    <>
      <Button size="lg" className="w-full gap-2" onClick={handleBuyNow}>
        <MessageCircle className="h-5 w-5" />
        {product.is_available ? "Buy Now via WhatsApp" : "Ask About Restock"}
      </Button>

      {/* This listing has multiple sarees — confirm which photo before
          continuing, so the exact one reaches the admin without guesswork. */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Order this saree?</DialogTitle>
            <DialogDescription>
              This listing has {total} sarees. We&apos;ll let the admin know
              exactly which one you want.
            </DialogDescription>
          </DialogHeader>
          {imageUrl && (
            <div className="relative mx-auto aspect-3/4 w-40 overflow-hidden rounded-lg border">
              <ProgressiveImage
                src={imageUrl}
                alt={label ?? product.title}
                fill
                sizes="160px"
                className="object-cover"
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Choose a different one
            </Button>
            <Button
              onClick={() => {
                setConfirmOpen(false);
                proceedToCheckout();
              }}
            >
              Yes, order this saree
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      <Dialog open={orderPlacedOpen} onOpenChange={setOrderPlacedOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <DialogTitle className="text-center">Order request sent!</DialogTitle>
            <DialogDescription className="text-center">
              We&apos;ve opened WhatsApp with your order details. Once you send
              that message, you can track its status anytime under{" "}
              <span className="font-medium text-foreground">
                Account → Inquiries
              </span>
              .
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <DialogClose render={<Button variant="outline" />}>
              Got it
            </DialogClose>
            <Link
              href="/account/inquiries"
              className={buttonVariants()}
              onClick={() => setOrderPlacedOpen(false)}
            >
              Track my orders
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
