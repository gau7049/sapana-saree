"use client";

import { useState } from "react";
import Link from "next/link";
import {
  forgotPassword,
  resendPasswordResetOtp,
  verifyPasswordResetOtp,
} from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import { PasswordInput } from "@/components/auth/password-input";
import { OtpInput } from "@/components/auth/otp-input";
import { useOtpCountdown, formatMmSs } from "@/hooks/use-otp-countdown";

type Step = "request" | "verify";

export function ForgotPasswordForm() {
  const [step, setStep] = useState<Step>("request");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const [username, setUsername] = useState("");
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [sentAt, setSentAt] = useState<number | null>(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");

  const { canResend, resendSecondsLeft, expirySecondsLeft, isExpired } = useOtpCountdown(
    expiresAt,
    sentAt
  );

  async function handleRequestSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const submittedUsername = (formData.get("username") as string) ?? "";

    const result = await forgotPassword(formData);
    setLoading(false);

    if (!result.status) {
      setError(result.message);
      return;
    }

    setUsername(submittedUsername);
    setExpiresAt(result.result?.expiresAt ?? null);
    setSentAt(Date.now());
    setStep("verify");
  }

  async function handleResend() {
    setResending(true);
    setError(null);
    const result = await resendPasswordResetOtp(username);
    setResending(false);

    if (!result.status) {
      setError(result.message);
      return;
    }

    setExpiresAt(result.result?.expiresAt ?? null);
    setSentAt(Date.now());
    setCode("");
  }

  async function handleVerifySubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const confirmPassword = formData.get("confirm_password") as string;

    if (code.length !== 6) {
      setError("Enter the 6-digit code.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    if (isExpired) {
      setError("That code has expired. Request a new one.");
      return;
    }

    setLoading(true);
    try {
      const result = await verifyPasswordResetOtp(username, code, password);
      // verifyPasswordResetOtp redirects on success, which throws — a
      // returned value here only ever means it failed.
      if (result && !result.status) {
        setError(result.message);
      }
    } catch (err) {
      if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (step === "verify") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Enter Reset Code</CardTitle>
          <CardDescription>
            We&apos;ve emailed a 6-digit code to the recovery email on file for{" "}
            <span className="font-medium">{username}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <form onSubmit={handleVerifySubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Verification Code</Label>
              <OtpInput value={code} onChange={setCode} disabled={loading} />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {isExpired
                    ? "Code expired"
                    : `Expires in ${formatMmSs(expirySecondsLeft)}`}
                </span>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={!canResend || resending}
                  className="font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
                >
                  {resending
                    ? "Sending..."
                    : canResend
                      ? "Resend code"
                      : `Resend in ${resendSecondsLeft}s`}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <PasswordInput
                id="password"
                name="password"
                placeholder="••••••••"
                required
                minLength={8}
                autoComplete="new-password"
                showStrength
                onValueChange={setPassword}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm_password">Confirm New Password</Label>
              <PasswordInput
                id="confirm_password"
                name="confirm_password"
                placeholder="••••••••"
                required
                minLength={8}
                autoComplete="new-password"
                compareValue={password}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reset Password
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <button
            type="button"
            onClick={() => {
              setStep("request");
              setError(null);
              setCode("");
            }}
            className="flex items-center text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Use a different username
          </button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Forgot Password</CardTitle>
        <CardDescription>
          Enter your username and, if you have a verified recovery email on file, we&apos;ll email you a 6-digit code
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        <form onSubmit={handleRequestSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="yourusername"
              required
              autoComplete="username"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Code
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <Link
          href="/login"
          className="flex items-center text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to login
        </Link>
      </CardFooter>
    </Card>
  );
}
