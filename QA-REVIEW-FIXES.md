# QA Review — Findings & Fix Plan

> **Source:** Full manual QA review performed on 18 Jul 2026 against the local dev build (`localhost:8765`).
> **Fix phase:** completed 18 Jul 2026 (same day). Every code-fixable item below has been implemented and
> regression-tested (TypeScript clean, ESLint clean, server-rendered output verified over HTTP, DB verified).
>
> **Legend for status lines:**
> - ✅ **FIXED & VERIFIED** — implemented and confirmed working in regression testing.
> - 🟠 **FIXED — needs your input** — code is done, but an external credential/asset from you is required.
> - 👁 **FIXED — visual re-check recommended** — implemented + typechecked; the automated browser session
>   couldn't exercise the click-path (preview pane was hidden → browser throttling), so give it a 30-second
>   manual click-through when you next run the app.

---

## Severity legend

| Severity | Meaning |
|----------|---------|
| 🚨 P0 — Launch blocker | Site cannot go live until fixed |
| 🔴 P1 — High | Will directly cost orders/trust in production |
| 🟡 P2 — Medium | Visible bugs & UX problems |
| 🟢 P3 — Low / polish | Content, cosmetics, nice-to-haves |

---

## 🚨 P0 — Launch blockers

### [x] P0-1. All transactional email is dead — 🟠 FIXED (code) — needs a correct Brevo API key from you

- **What was done:**
  - `src/lib/brevo/client.ts`: removed the silent `no-reply@yourdomain.com` fallback; missing `BREVO_API_KEY`
    or `BREVO_FROM_EMAIL` now logs a clear error instead of failing invisibly.
  - `.env.local.example`: documented both variables and where to generate them.
  - `.env.local`: wired in the key + sender you provided.
  - Admin → Settings now does a **live API health check** (see P3-6), so a bad key shows "Connection failed"
    instead of a false "Connected".
- **⚠️ ACTION NEEDED FROM YOU:** the key you provided is a Brevo **SMTP key** (`xsmtpsib-…`). The app calls
  Brevo's **REST API**, which needs an **API key** (`xkeysib-…`). Generate one at
  Brevo → Settings → **API Keys** (https://app.brevo.com/settings/keys/api), put it in `.env.local` as
  `BREVO_API_KEY`, and confirm `gausapai@gmail.com` is a **verified sender** in Brevo (Settings → Senders).
  Admin → Settings will flip Brevo to "Connected" when it's right.
- **Verify after key swap:** checkout signup → verification mail arrives → link advances the modal;
  Forgot Password → reset mail arrives → reset works. (`/auth/callback` magic-link path still untested
  end-to-end — test it once mail flows.)

### [x] P0-2. Storefront search box does not search — ✅ FIXED & VERIFIED

- **Refined root cause:** Base UI's `Input` (FieldControl) does not reliably surface change events to React —
  the submit handler saw an empty value while the user's text sat in the DOM (matches the
  "uncontrolled FieldControl" console warnings).
- **What was done (`src/components/shared/search-input.tsx`):**
  - Input is now deliberately **uncontrolled**; the submit handler reads the live DOM value via `FormData` —
    works with any input implementation.
  - Added `name="q"` + `action="/search"` so even a non-hydrated page degrades to a working native GET search.
  - Added a visually-hidden submit button so Enter-to-submit is guaranteed by the HTML spec in all browsers.
  - Widened `src/components/ui/input.tsx` props to Base UI's real prop type (also unlocks `onValueChange`
    for other consumers).
- **Verified:** `/search?q=silk` renders "6 results" with product cards; submission works both hydrated
  (client-side navigation) and unhydrated (native GET fallback).

### [x] P0-3. Reviews invisible everywhere (admin queue + storefront) — ✅ FIXED & VERIFIED

- **What was done:**
  - **Migration `supabase/migrations/012_fix_reviews_wishlists_fk_and_inquiry_status.sql`** (applied to the DB):
    - `reviews.user_id` FK repointed `auth.users` → `profiles` (same fix migration 010 made for inquiries).
    - `wishlists.user_id` repointed too (same latent drift).
    - Added `UNIQUE (user_id, product_id)` on reviews — the app already mapped error 23505 to
      "already reviewed", but the constraint never existed, so duplicates were silently possible.
  - `src/lib/queries/reviews.ts`: PostgREST errors are now **logged** instead of silently swallowed
    (this is what hid the bug); added `getUserReviewForProduct()` for P2-7.
- **Verified:** a pending review appears in Admin → Reviews with the reviewer's username; after approval it
  renders on the product page with its title and body. "No reviews yet" no longer shows when reviews exist.

---

## 🔴 P1 — High priority

### [x] P1-1. WhatsApp handoff popup-blocked after checkout wizard — 👁 FIXED — visual re-check recommended

- **What was done (`src/components/products/checkout-modal.tsx`):** removed the `setTimeout`-driven auto
  `window.open` (always popup-blocked without a user gesture). The success step now shows an explicit
  **"Continue to WhatsApp"** button — clicking it fires the handoff synchronously from a real user gesture,
  which browsers allow. The step still refreshes the profile snapshot first so the WhatsApp message includes
  the just-saved address.
- **Re-check:** run a first-purchase flow (after P0-1's key swap) and confirm the WhatsApp tab opens from the
  success-step button.

### [x] P1-2. WhatsApp number placeholder / broken footer link — 🟠 FIXED (code) — needs the real number

- **What was done (`src/components/layout/footer.tsx`):** the footer icon link (previously literally
  `https://wa.me/` — a dead link) and the "Order via WhatsApp" text (previously not a link at all) now both
  build from `buildGenericWhatsAppUrl()` → single source of truth: `NEXT_PUBLIC_WHATSAPP_NUMBER`.
- **⚠️ ACTION NEEDED FROM YOU:** set the real business number in `.env.local`
  (`NEXT_PUBLIC_WHATSAPP_NUMBER=91XXXXXXXXXX`) — it is still the placeholder `919999999999`.
- **Verified:** all wa.me links in rendered pages now carry the env number + prefilled message.

### [x] P1-3. Filters inaccessible on mobile/tablet — ✅ FIXED (button verified; open drawer once visually)

- **What was done:** new `src/components/products/product-filters-drawer.tsx` — a "Filters" button (visible
  below `lg`, with an active-filter count badge) opening the same `ProductFilters` in a dialog with a
  "Show results" close button. Wired into `src/app/(storefront)/sarees/page.tsx` next to the sort control.
- **Verified:** the Filters button renders on `/sarees`; drawer interaction itself is hydration-dependent —
  give it one tap on a phone-sized window.

### [x] P1-4. Stale homepage cache ("Sold Out" everywhere) — ✅ FIXED & VERIFIED (finding corrected)

- **Correction to the original finding:** product create/update/delete actions **already** called
  `updateTag("featured-products")` / `updateTag("product-filters")` (the original review's grep missed
  `updateTag`). The stale data observed came from DB changes made *outside* server actions (seed scripts),
  which no invalidation can catch, plus the gaps below — which were real and are now fixed:
  - `src/actions/images.ts` (delete image, reorder, set primary): now invalidate `featured-products` and
    revalidate `/` and `/sarees` — homepage featured cards embed these images.
  - `src/app/api/images/upload/route.ts`: route handlers can't call `updateTag`, so it uses
    `revalidateTag("featured-products", "max")` per the Next 16 docs.
  - `src/actions/products.ts`: delete/archive/bulk operations now also revalidate the affected
    `/sarees/[slug]` paths (they previously never did — deleted products stayed cached up to 1 h; this was
    the real mechanism behind P2-3's stale pages).

---

## 🟡 P2 — Medium priority

### [x] P2-1. Selects show raw values instead of labels — ✅ FIXED & VERIFIED

- **What was done:** passed Base UI Select's `items` prop (which makes `<Select.Value>` render the selected
  item's **label**) in: `product-sort.tsx`, `admin-products-toolbar.tsx` (status, category, sort), and
  `product-form.tsx` (category, status).
- **Verified:** `/sarees?sort=price-asc` renders "Price: Low to High" in the trigger; the admin edit form
  renders "Silk Sarees" and "Published" instead of a UUID and `published`.

### [x] P2-2. Filter price inputs desync from URL — 👁 FIXED — visual re-check recommended

- **What was done (`src/components/products/product-filters.tsx`):** price inputs are now controlled local
  state using Base UI's `onValueChange`, debounced 400 ms before updating the URL (no more router push per
  keystroke), and re-synced from the URL via React's render-time "adjusting state when props change" pattern —
  so Clear and back/forward navigation reset the boxes correctly.
- **Re-check:** set a min price, hit Clear, confirm the input empties and results reset.

### [x] P2-3. Unknown/deleted product URLs return 200 — ✅ FIXED (with an honest framework caveat)

- **What was done:**
  - `notFound()` is now thrown from `generateMetadata` in **both** `sarees/[slug]` and `categories/[slug]`
    (previously they returned a fake "Not Found" title with normal page status).
  - Deleted/archived slugs are revalidated immediately (see P1-4), so a deleted product no longer serves its
    stale cached page for up to an hour.
- **Verified:** unknown slugs render the not-found UI with **`<meta name="robots" content="noindex">`** —
  crawlers will not index them.
- **Caveat:** the raw HTTP status is still 200 because the app streams (the `loading.tsx` shell flushes
  headers before the product lookup finishes) — this is inherent to Next streaming with loading boundaries.
  The `noindex` meta is the SEO-effective signal here. If a hard 404 status ever becomes a requirement, the
  storefront `loading.tsx` boundary would have to go, trading perceived speed for status codes.

### [x] P2-4. Category delete had weak confirmation — ✅ FIXED (finding corrected; dialog needs one visual check)

- **Correction:** there *was* a native `confirm()` — the automated browser auto-accepted it during the review,
  making it look like no confirmation existed. Still worth fixing: native confirm carries no context.
- **What was done (`src/components/admin/category-manager.tsx`):** replaced `confirm()` with a proper dialog
  matching the product-delete pattern: names the category, explains that products become uncategorized (not
  deleted), counts subcategories that will become top-level, and suggests "mark inactive" as the reversible
  alternative.

### [x] P2-5. Page titles duplicated the site name — ✅ FIXED & VERIFIED

- **What was done:** `src/lib/seo.ts` now emits the bare page title (the root layout's `title.template` is the
  single place appending "| Sapana Saree"); removed the manual suffix from `sarees/[slug]` and
  `categories/[slug]` metadata. OpenGraph/Twitter still get the full title (they bypass the template).
- **Verified:** `/search`, `/sarees`, and product pages all render a single "| Sapana Saree".

### [x] P2-6. Header auth state stale after login/logout — 👁 FIXED — visual re-check recommended

- **What was done:** auth state moved from per-component `useState` (each `useAuth()` had its own copy — the
  modal's refresh never reached the header) to a **shared zustand store** (`src/stores/auth-store.ts`).
  `use-auth.ts` keeps the same API and additionally re-syncs from the session cookie on every route change
  (cheap, no network) — covering server-action sign-in/sign-out, which never emits client-side auth events.
  Sign-out (header + account button) now optimistically clears the shared state so the UI flips instantly.
- **Re-check:** log in → header shows account icons without a manual reload; log out → "Sign In" returns.

### [x] P2-7. No feedback that a review is pending — 👁 FIXED — visual re-check recommended

- **What was done:** the product page now fetches the signed-in user's own review
  (`getUserReviewForProduct`) and passes it to `ReviewForm`, which renders a status card instead of the empty
  form: "Your review is awaiting approval" (pending) / "Thanks for your review!" (approved). After submitting,
  the card appears immediately (local state) — no more "No reviews yet. Be the first!" inviting a duplicate.
  Duplicates are now also blocked at the DB level (unique constraint, P0-3). Star buttons got aria-labels.
- **Note:** the "first Submit click did nothing" observation from the review could not be reproduced under
  automation; keep an eye out — if it recurs it's likely focus-related.

### [x] P2-8. `/search` empty state was wrong before searching — ✅ FIXED & VERIFIED

- **What was done (`src/app/(storefront)/search/page.tsx`):** three distinct states now — no query: search
  tips + category chips as a starting point; query with 0 results: "No results for X" with spelling/fabric
  suggestions (no mention of nonexistent filters); results: grid + pagination.
- **Verified:** bare `/search` renders the category-chip landing; `?q=silk` renders results.

### [x] P2-9. Inquiry status overstated + no recovery path — ✅ FIXED (badge/button verified; needs live inquiry to fully exercise)

- **What was done:**
  - Migration 012: inquiry status check now includes **`initiated`**, which is also the new column default.
  - `createInquiry` inserts `initiated` — the client can't verify the WhatsApp tab opened, so "sent" was a lie.
  - Admin inquiry manager + customer My Inquiries handle the new status (badge styles, "Mark as responded"
    from `initiated`).
  - **My Inquiries now has an "Open WhatsApp" button** on initiated/sent inquiries that rebuilds the wa.me
    link from the stored message — an interrupted (popup-blocked) handoff is finally recoverable.
  - `src/types/database.ts` updated.

---

## 🟢 P3 — Low priority / content & polish

### [ ] P3-1. Replace placeholder content — 🟠 STILL PENDING — needs assets from you
- Hero "Replace with your hero image", 🪡 category icons, and `placehold.co` product images all remain.
  These need real photography/artwork; upload product images via Admin → Products → Edit (Cloudinary is
  connected and working).

### [x] P3-2. Remove test data — ✅ DONE & VERIFIED
- Deleted the "Testing 1" product (and its two Cloudinary assets), and the three old test contact messages.
  Homepage and admin verified clean. (The QA test user/inquiries/review/wishlist from the review session were
  already cleaned up at review time.)

### [x] P3-3. `/signup` loses context — ✅ FIXED
- `/signup` now honors `?redirect=` (same contract as `/login`), and the login page's "Sign up" link forwards
  its own redirect parameter. The signup page wraps the form in `Suspense` for `useSearchParams`.

### [ ] P3-4. Password-recovery dead end without a recovery email — DEFERRED (by design for now)
- Unchanged in this phase: it depends on email actually working (P0-1) and a product decision (post-signup
  nudge vs. required email). Revisit after the Brevo key is fixed.

### [x] P3-5. Dashboard earns its screen space — ✅ FIXED
- Added a **Recent Inquiries** card (latest 5: product, customer, date, status badge + "View all") to the
  admin dashboard. Stat tiles already linked to their pages (original finding overstated this). The card
  hides itself when there are no inquiries.

### [x] P3-6. Settings "Connected" badges were presence checks — ✅ FIXED & VERIFIED
- New `src/lib/service-health.ts`: Brevo (`GET /v3/account`) and Cloudinary (`GET /ping`) are pinged live
  server-side with timeouts. Badges are now Connected / **Connection failed** / Not configured.
- **Verified:** with the current (wrong-type) Brevo key the page correctly shows Brevo "Connection failed"
  and Cloudinary "Connected" — exactly the misconfiguration visibility P0-1 lacked.

---

## Regression-test summary (fix phase)

**Verified automatically** (HTTP/SSR + DB + typecheck):
- Search: landing state, `?q=silk` results, native fallback, Enter-to-submit guarantee.
- Reviews pipeline: pending → admin queue (with reviewer name) → approved → rendered on product page.
- Titles single-suffixed on all sampled pages; sort/category/status selects render labels.
- Unknown slugs: not-found UI + `noindex`; migration 012 live in DB; homepage free of test data and
  false "Sold Out" badges; footer wa.me links built from env; mobile Filters button present on `/sarees`;
  admin dashboard/products/categories/settings all render; settings health badges accurate.
- `tsc --noEmit` clean; ESLint clean except one pre-existing warning in `theme-toggle.tsx` (untouched).

**Recommended 5-minute manual click-through** (items marked 👁 — the automated browser's preview pane was
hidden during the fix phase, which throttles hydration and blocks click-testing; everything is typechecked
and code-reviewed):
1. Log in → header updates instantly; log out → same.
2. `/sarees` on a phone-width window → open Filters drawer → set price → Clear.
3. Buy Now (with complete profile) → WhatsApp opens; first-time flow → success step shows
   "Continue to WhatsApp" button → tab opens on click.
4. Submit a review → "awaiting approval" card appears; approve in admin → shows on product page.
5. Delete a throwaway category → new confirmation dialog appears.
6. My Inquiries → "Open WhatsApp" button works.

**Blocked until you act:**
- Correct **Brevo API key** (`xkeysib-…`, not the SMTP `xsmtpsib-…` key) + verified sender → then test
  signup verification and password reset end-to-end, including `/auth/callback`.
- Real **WhatsApp number** in `NEXT_PUBLIC_WHATSAPP_NUMBER`.
- Product photography / hero / category images (P3-1).

*Environment note: the dev machine's filesystem is slow enough that Next's `.next/dev` cache corrupted twice
during testing (symptoms: phantom 404s on existing routes, broken generated types). If routes ever 404 or
types explode inexplicably in dev: stop the server, delete `.next`, restart. Consider moving the project to a
faster local disk.*
