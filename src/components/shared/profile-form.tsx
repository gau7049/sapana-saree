"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { updateProfile } from "@/actions/profile";
import { resendVerificationEmail } from "@/actions/auth";
import { handleAction } from "@/lib/action-handler";
import { SignOutButton } from "@/components/auth/sign-out-button";

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
  const [resending, setResending] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  // The verification email link lands back here with ?verified=1 (see
  // lib/email-verification.ts) — show a toast once, then strip the param.
  useEffect(() => {
    if (searchParams.get("verified") === "1") {
      toast.success("Email verified successfully.");
      router.replace("/account");
    }
  }, [searchParams, router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    await handleAction(updateProfile(formData));
    setLoading(false);
  }

  async function handleResendVerification() {
    setResending(true);
    await handleAction(resendVerificationEmail());
    setResending(false);
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
              <div className="flex items-center justify-between gap-3 rounded-md bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300">
                <span>Verify this email to enable password recovery.</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={resending}
                  onClick={handleResendVerification}
                >
                  {resending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Resend link
                </Button>
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
