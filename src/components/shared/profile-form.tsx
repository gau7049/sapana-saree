"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { updateProfile } from "@/actions/profile";
import { sendEmailVerificationOtp, verifyEmailOtp } from "@/actions/auth";
import { handleAction } from "@/lib/action-handler";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { OtpInput } from "@/components/auth/otp-input";
import { useOtpCountdown, formatMmSs } from "@/hooks/use-otp-countdown";

export function ProfileForm({
  username,
  email,
  emailVerified,
  fullName,
}: {
  username: string;
  email: string | null;
  emailVerified: boolean;
  fullName: string;
}) {
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState("");
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [sentAt, setSentAt] = useState<number | null>(null);
  const router = useRouter();

  const { canResend, resendSecondsLeft, expirySecondsLeft, isExpired } = useOtpCountdown(
    expiresAt,
    sentAt
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    await handleAction(updateProfile(formData));
    setLoading(false);
  }

  async function handleSendCode() {
    setSending(true);
    const result = await handleAction(sendEmailVerificationOtp());
    setSending(false);
    if (result.status) {
      setExpiresAt(result.result?.expiresAt ?? null);
      setSentAt(Date.now());
      setCode("");
    }
  }

  async function handleVerifyCode() {
    setVerifying(true);
    const result = await handleAction(verifyEmailOtp(code));
    setVerifying(false);
    if (result.status) {
      setExpiresAt(null);
      setSentAt(null);
      setCode("");
      router.refresh();
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" value={username} disabled className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              name="full_name"
              defaultValue={fullName}
              placeholder="Your full name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Recovery Email (optional)</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={email ?? ""}
              placeholder="you@example.com"
            />
            <p className="text-xs text-muted-foreground">
              Used only to recover your password if you forget it.
            </p>
            {email && !emailVerified && (
              <div className="space-y-3 rounded-md bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300">
                {sentAt === null ? (
                  <div className="flex items-center justify-between gap-3">
                    <span>Verify this email to enable password recovery.</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={sending}
                      onClick={handleSendCode}
                    >
                      {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Send code
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <span>Enter the 6-digit code we emailed you.</span>
                    <OtpInput value={code} onChange={setCode} disabled={verifying} />
                    <div className="flex items-center justify-between text-xs">
                      <span>
                        {isExpired ? "Code expired" : `Expires in ${formatMmSs(expirySecondsLeft)}`}
                      </span>
                      <button
                        type="button"
                        onClick={handleSendCode}
                        disabled={!canResend || sending}
                        className="font-medium underline disabled:cursor-not-allowed disabled:no-underline disabled:opacity-60"
                      >
                        {sending
                          ? "Sending..."
                          : canResend
                            ? "Resend code"
                            : `Resend in ${resendSecondsLeft}s`}
                      </button>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      disabled={verifying || code.length !== 6 || isExpired}
                      onClick={handleVerifyCode}
                    >
                      {verifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Verify
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between pt-2">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
            <SignOutButton />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
