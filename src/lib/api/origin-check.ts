// Server Actions get Next's built-in same-origin CSRF protection automatically;
// plain Route Handlers don't, so state-changing ones check it by hand.
//
// Compares the Origin header's host against the Host header exactly — a
// substring/`.includes()` check would wrongly accept an attacker origin like
// `https://evil-<host>.com` for a host of `<host>.com`.
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return true;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
