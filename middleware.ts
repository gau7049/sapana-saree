// Next.js only picks up middleware from a root-level middleware.ts, but the
// actual logic lives in src/proxy.ts (kept under src/ with everything else,
// and importable/testable like a normal module). This file just re-exports
// it so Next finds it.
export { proxy as default } from "@/proxy";

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
