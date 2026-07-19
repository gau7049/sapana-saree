import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { createLogger } from "@/lib/logger";
import { common } from "@/lib/messages";
import { HTTP_STATUS, PROTECTED_ROUTES, ADMIN_ROUTES, AUTH_ROUTES, ADMIN_ROLES } from "@/lib/constants";

// Next.js middleware — runs on every matched request, before any page or API
// route. Three jobs: rate-limit /api/*, refresh the Supabase session cookie,
// and redirect unauthenticated/unauthorized visitors away from protected and
// admin routes. Re-exported as the root middleware.ts (see that file).
const logger = createLogger("proxy");

async function refreshSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  // getUser() (not getSession()) validates the JWT against Supabase and
  // transparently refreshes an expired access token via the refresh cookie.
  const { data: { user } } = await supabase.auth.getUser();

  return { response, user, supabase };
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

  // Remember the referral code from shared links (?ref=SAPXXXXXX) so signup can
  // credit the referrer even if the visitor browses around first.
  const refCode = request.nextUrl.searchParams.get("ref");

  if (!isProtected && !isAdmin && !isAuthRoute) {
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set("X-Request-Id", requestId);
    if (refCode) {
      response.cookies.set("sapana_ref", refCode.slice(0, 12), {
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
        sameSite: "lax",
      });
    }
    return response;
  }

  const { response, user, supabase } = await refreshSession(request);
  response.headers.set("X-Request-Id", requestId);

  if ((isProtected || isAdmin) && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // UX-level gate only — Row Level Security on the `profiles`/admin-only
  // tables is what actually enforces this if a request bypasses middleware.
  if (isAdmin && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !ADMIN_ROLES.includes(profile.role as (typeof ADMIN_ROLES)[number])) {
      const homeUrl = request.nextUrl.clone();
      homeUrl.pathname = "/";
      return NextResponse.redirect(homeUrl);
    }
  }

  if (isAuthRoute && user) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/";
    return NextResponse.redirect(homeUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
