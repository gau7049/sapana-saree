"use client";

import { useEffect, useState } from "react";
import { OTP_RESEND_COOLDOWN_SECONDS } from "@/lib/constants";

// Drives the "resend in Ns" / "code expires in M:SS" UI shared by every OTP
// screen, purely client-side against timestamps the server already returned
// (expiresAt) or that we record locally the moment a send succeeds (sentAt).
export function useOtpCountdown(expiresAt: number | null, sentAt: number | null) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (expiresAt === null && sentAt === null) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [expiresAt, sentAt]);

  const resendSecondsLeft = sentAt
    ? Math.max(0, OTP_RESEND_COOLDOWN_SECONDS - Math.floor((now - sentAt) / 1000))
    : 0;
  const expirySecondsLeft = expiresAt ? Math.max(0, Math.floor((expiresAt - now) / 1000)) : 0;
  const isExpired = expiresAt !== null && now >= expiresAt;

  return {
    canResend: resendSecondsLeft === 0,
    resendSecondsLeft,
    expirySecondsLeft,
    isExpired,
  };
}

export function formatMmSs(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
