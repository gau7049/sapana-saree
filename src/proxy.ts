import { type NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { createLogger } from "@/lib/logger";
import { common } from "@/lib/messages";
import { HTTP_STATUS, PROTECTED_ROUTES, ADMIN_ROUTES, AUTH_ROUTES } from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/supabase/helpers";

const logger = createLogger("proxy");

async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const hasLocalSession = request.cookies.has("local-auth-session");
  if (!isSupabaseConfigured()) return hasLocalSession;

  const hasSupabaseCookie = request.cookies.getAll().some(
    (c) => c.name.startsWith("sb-")
  );
  if (!hasSupabaseCookie) return hasLocalSession;

  try {
    const { updateSession } = await import("@/lib/supabase/middleware");
    const { user } = await updateSession(request);
    return !!user;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const startTime = Date.now();

  const requestId = crypto.randomUUID();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-real-ip")
    ?? "unknown";

  if (pathname.startsWith("/api/") && pathname !== "/api/health") {
    const { allowed, remaining, resetAt } = checkRateLimit(ip);

    if (!allowed) {
      logger.warn("Rate limit exceeded", { requestId, ip, path: pathname });
      return NextResponse.json(
        { status: false, message: common.RATE_LIMIT_EXCEEDED, result: null },
        {
          status: HTTP_STATUS.TOO_MANY_REQUESTS,
          headers: {
            "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)),
            "X-RateLimit-Remaining": "0",
            "X-Request-Id": requestId,
          },
        }
      );
    }

    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set("X-RateLimit-Remaining", String(remaining));
    response.headers.set("X-Request-Id", requestId);

    logger.info("API request", {
      requestId,
      method: request.method,
      path: pathname,
      ip,
      duration: Date.now() - startTime,
    });

    return response;
  }

  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  const isAdmin = ADMIN_ROUTES.some((r) => pathname.startsWith(r));
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));

  const authenticated = (isProtected || isAdmin || isAuthRoute)
    ? await isAuthenticated(request)
    : false;

  if ((isProtected || isAdmin) && !authenticated) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && authenticated) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/";
    return NextResponse.redirect(homeUrl);
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("X-Request-Id", requestId);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
