"use client";

import { useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

// The header's icons hydrate a beat after the page does (auth state loads
// client-side), so poll briefly instead of assuming they're already mounted.
function waitForElement(selector: string, timeoutMs = 3000): Promise<boolean> {
  return new Promise((resolve) => {
    const start = Date.now();
    function check() {
      if (document.querySelector(selector)) {
        resolve(true);
        return;
      }
      if (Date.now() - start >= timeoutMs) {
        resolve(false);
        return;
      }
      requestAnimationFrame(check);
    }
    check();
  });
}

/**
 * First-time spotlight tour, shown once right after a brand-new account is
 * created through the standalone /signup page (never for accounts created
 * mid-checkout via the WhatsApp order modal — see withWelcomeMarker in
 * src/actions/auth.ts, the only place that appends ?welcome=1).
 */
export function OnboardingTour() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const welcome = searchParams.get("welcome");

  useEffect(() => {
    if (welcome !== "1") return;

    // Strip the marker immediately so a refresh or back-navigation can never
    // re-trigger the tour.
    const params = new URLSearchParams(searchParams.toString());
    params.delete("welcome");
    router.replace(params.size ? `${pathname}?${params}` : pathname, { scroll: false });

    let cancelled = false;
    (async () => {
      const hasAccountMenu = await waitForElement('[data-tour="account-menu"]');
      if (cancelled || !hasAccountMenu) return;

      const hasWishlist = document.querySelector('[data-tour="wishlist"]') !== null;

      driver({
        showProgress: true,
        nextBtnText: "Next",
        prevBtnText: "Back",
        doneBtnText: "Got it",
        steps: [
          ...(hasWishlist
            ? [
                {
                  element: '[data-tour="wishlist"]',
                  popover: {
                    title: "Save your favorites",
                    description:
                      "Tap the heart to save sarees you love — find them anytime in your wishlist.",
                  },
                },
              ]
            : []),
          {
            element: '[data-tour="account-menu"]',
            popover: {
              title: "Your account",
              description:
                "Your account, past orders, and loyalty points all live here.",
            },
          },
          {
            popover: {
              title: "Ready to shop!",
              description:
                'Found something you like? Tap "Buy Now via WhatsApp" on any product to order directly — no cart needed. Track every order under Account → Inquiries.',
            },
          },
        ],
      }).drive();
    })();

    return () => {
      cancelled = true;
    };
    // Runs once on mount to catch the marker from the signup redirect — not a
    // derived-state sync, so omitting deps here is intentional.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
