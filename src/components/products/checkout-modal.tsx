"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PasswordInput } from "@/components/auth/password-input";
import { AddressForm } from "@/components/shared/address-form";
import { signUp } from "@/actions/auth";
import { updateProfile } from "@/actions/profile";
import { getCheckoutProfileStatus } from "@/actions/checkout";
import { handleAction } from "@/lib/action-handler";
import { hasSavedAddress } from "@/lib/profile-helpers";
import { PaymentChoice } from "@/components/products/payment-choice";
import type { Profile, PaymentMethod } from "@/types";

type Step = "signup" | "complete_profile" | "address" | "success";
type FlowOrigin = "signup" | "profile";

function computeInitialStep(profile: Profile | null): Step {
  if (!profile) return "signup";
  if (!profile.full_name?.trim()) return "complete_profile";
  if (!hasSavedAddress(profile)) return "address";
  return "success";
}

interface CheckoutModalProps {
  open: boolean;
  profile: Profile | null;
  price?: number;
  onClose: () => void;
  onComplete: (
    finalProfile: Profile,
    paymentMethod: PaymentMethod,
    pointsToRedeem: number,
    pointValueInr: number
  ) => void;
}

export function CheckoutModal({ open, profile, price, onClose, onComplete }: CheckoutModalProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent>
        {/* Rendered fresh each time the modal opens, so step state always starts
            from the current profile snapshot without an effect-based reset. */}
        {open && (
          <CheckoutModalBody profile={profile} price={price} onComplete={onComplete} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function CheckoutModalBody({
  profile,
  price,
  onComplete,
}: {
  profile: Profile | null;
  price?: number;
  onComplete: (
    finalProfile: Profile,
    paymentMethod: PaymentMethod,
    pointsToRedeem: number,
    pointValueInr: number
  ) => void;
}) {
  const [step, setStep] = useState<Step>(() => computeInitialStep(profile));
  const [flowOrigin] = useState<FlowOrigin>(profile ? "profile" : "signup");
  const [knownProfile, setKnownProfile] = useState<Profile | null>(profile);
  // Fetched fresh at the success step so a brand-new signup sees their welcome
  // points available for redemption on this very first order.
  const [loyalty, setLoyalty] = useState<{ balance: number; pointValueInr: number }>({
    balance: 0,
    pointValueInr: 1,
  });
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (step !== "success") return;
    let cancelled = false;
    // Refresh the profile snapshot so the WhatsApp message includes the address
    // just saved, but DON'T auto-fire onComplete: window.open outside a user
    // gesture is popup-blocked, silently killing the handoff. The user clicks
    // "Continue to WhatsApp" instead, which opens the tab from a real click.
    (async () => {
      const result = await getCheckoutProfileStatus();
      if (cancelled) return;
      const finalProfile = result.result?.profile;
      if (finalProfile) setKnownProfile(finalProfile);
      setLoyalty({
        balance: result.result?.loyaltyBalance ?? 0,
        pointValueInr: result.result?.pointValueInr ?? 1,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [step]);

  async function handleSignupSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const pwd = formData.get("password") as string;
    const confirm = formData.get("confirm_password") as string;
    if (pwd !== confirm) return;

    formData.set("redirect", "stay");

    setLoading(true);
    const result = await handleAction(signUp(formData));
    setLoading(false);
    if (result.status) setStep("address");
  }

  async function handleCompleteProfileSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    setLoading(true);
    const result = await handleAction(updateProfile(formData));
    setLoading(false);
    if (!result.status) return;

    setStep(knownProfile && hasSavedAddress(knownProfile) ? "success" : "address");
  }

  return (
    <>
        {step === "signup" && (
          <>
            <DialogHeader>
              <DialogTitle>Almost there — create your account</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSignupSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="checkout-username">Username</Label>
                <Input
                  id="checkout-username"
                  name="username"
                  required
                  minLength={3}
                  maxLength={20}
                  pattern="[a-zA-Z][a-zA-Z0-9_]{2,19}"
                  autoComplete="username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkout-full-name">Full Name</Label>
                <Input id="checkout-full-name" name="full_name" required minLength={2} autoComplete="name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkout-password">Password</Label>
                <PasswordInput
                  id="checkout-password"
                  name="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  showStrength
                  onValueChange={setPassword}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkout-confirm-password">Confirm Password</Label>
                <PasswordInput
                  id="checkout-confirm-password"
                  name="confirm_password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  compareValue={password}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Continue
              </Button>
            </form>
          </>
        )}

        {step === "complete_profile" && (
          <>
            <DialogHeader>
              <DialogTitle>A couple more details</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCompleteProfileSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="checkout-full-name-2">Full Name</Label>
                <Input
                  id="checkout-full-name-2"
                  name="full_name"
                  required
                  minLength={2}
                  defaultValue={knownProfile?.full_name ?? ""}
                  autoComplete="name"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Continue
              </Button>
            </form>
          </>
        )}

        {step === "address" && (
          <>
            <DialogHeader>
              <DialogTitle>Where should we deliver?</DialogTitle>
            </DialogHeader>
            <AddressForm
              addressLine1={knownProfile?.address_line1 ?? ""}
              addressLine2={knownProfile?.address_line2 ?? ""}
              city={knownProfile?.city ?? ""}
              state={knownProfile?.state ?? ""}
              country={knownProfile?.country ?? ""}
              postalCode={knownProfile?.postal_code ?? ""}
              phone={knownProfile?.phone ?? ""}
              onSuccess={() => setStep("success")}
            />
          </>
        )}

        {step === "success" && (
          <>
            <DialogHeader>
              <DialogTitle>
                {flowOrigin === "signup"
                  ? "You're all set! How would you like to pay?"
                  : "Details saved! How would you like to pay?"}
              </DialogTitle>
            </DialogHeader>
            <PaymentChoice
              disabled={!knownProfile}
              loyalty={loyalty}
              price={price}
              onSelect={(method, points) => {
                // Selecting a payment option is the user gesture that lets the
                // subsequent window.open (WhatsApp handoff) avoid popup blocking.
                if (knownProfile) {
                  onComplete(knownProfile, method, points, loyalty.pointValueInr);
                }
              }}
            />
          </>
        )}
    </>
  );
}
