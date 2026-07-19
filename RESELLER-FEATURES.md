# Reseller Trust & Conversion Pack

> **Implemented & verified: 19 Jul 2026.** Growth features chosen for a reseller-run,
> WhatsApp-order store where commissions make discounts/cashback unattractive. Everything
> here either **prevents disputes**, **cuts support chatter**, or **drives free
> word-of-mouth distribution** — value for both the customer and the business, without
> giving margin away.
>
> Business conditions these are built around: delivery 7–10 days · no returns ·
> mandatory uncut unboxing video for claims · COD available at +₹150.

---

## What was built

### 1. Order terms, visible before anyone commits ✅
- **Product page strip** ([order-terms.tsx](src/components/products/order-terms.tsx)) under the
  Buy/Wishlist buttons: delivery window, COD charge, no-returns, unboxing-video requirement,
  with a link to the full policy.
- **`/policies` page** ([policies/page.tsx](src/app/(storefront)/policies/page.tsx)) — the full
  ordering & delivery policy in plain language, including exactly how to record a valid
  unboxing video and the 24-hour claim window. Linked from the footer ("Ordering & Delivery
  Policy") and included in the sitemap.
- All copy comes from one place: `ORDER_TERMS`, `DELIVERY_ESTIMATE`, `COD_CHARGE` in
  [constants.ts](src/lib/constants.ts) — change a number once, it updates everywhere.

### 2. Payment choice + terms acknowledgment inside the order message ✅
- Tapping **Buy Now** (or finishing the first-time checkout wizard) now asks one question:
  **Online payment** or **Cash on Delivery (+₹150)** ([payment-choice.tsx](src/components/products/payment-choice.tsx)),
  with the order terms shown right under the two buttons.
- The choice is written into the WhatsApp message, along with:
  *"I understand: delivery in 7–10 days, no returns/exchanges, and an uncut unboxing video is
  required for any claim."*
  The customer sends the conditions **in their own opening message** — written proof the terms
  were seen before ordering, which is the strongest dispute protection a no-return store can have.
- The choice is also stored on the inquiry (`payment_method`), so admin sees "COD (+₹150)" or
  "Online payment" on every inquiry card without asking.
- Bonus: selecting a payment option **is** the click that opens WhatsApp, so the handoff can
  never be popup-blocked.

### 3. Order tracking timeline ✅
- **Admin** ([inquiry-manager.tsx](src/components/admin/inquiry-manager.tsx)): the inquiry
  lifecycle is now `initiated → responded → shipped → delivered → completed`.
  "Mark as shipped" opens a small dialog for courier + tracking number (optional). Cancel is
  only offered before shipping.
- **Customer** (My Account → Inquiries): each order shows a 4-step timeline
  (Order started → Confirmed → Shipped → Delivered) with real dates (`shipped_at`,
  `delivered_at`), plus the courier/tracking number once shipped.
- **Why it pays off:** with 7–10 day delivery, "where is my order?" is the #1 support message.
  Now the answer is on the site, updated with the same two clicks the admin already makes.

### 4. Unboxing-video reminder, exactly when it matters ✅
- Once an order is **shipped** or **delivered**, the customer's order card shows an amber
  warning: *"Before opening your package — record one uncut, unpaused video starting from the
  sealed package…"* with a link to the policy and a one-tap
  **"Send unboxing video on WhatsApp"** button (prefilled with the product name).
- Customer benefit: they can't accidentally void their claim rights.
  Business benefit: valid videos, fewer arguments, claims resolvable in minutes.

### 5. Share with family & friends ✅
- Product pages now have a **WhatsApp share button** ([share-button.tsx](src/components/products/share-button.tsx)):
  opens the OS share sheet on mobile (covers WhatsApp + everything else) or a wa.me
  contact-picker link on desktop, prefilled with the saree name, price, and link.
  A copy-link button sits next to it.
- Sarees sell through family WhatsApp groups; this makes the share one tap from the page
  instead of screenshot-and-forward. Zero margin cost — pure distribution.

---

## Data model changes

Migration [013_order_tracking_and_payment.sql](supabase/migrations/013_order_tracking_and_payment.sql)
(**applied to the live DB**):
- `inquiries.status` check now includes `shipped`, `delivered`.
- New columns: `payment_method` (`online`/`cod`), `tracking_courier`, `tracking_number`,
  `shipped_at`, `delivered_at`.

> Note: the direct DB host (`db.…supabase.co`) is IPv6-only and this machine's IPv6 is
> unreliable — migration was applied via the IPv4 session pooler
> `aws-1-ap-south-1.pooler.supabase.com:5432` (user `postgres.<project-ref>`). If
> `npm run db:migrate` ever fails with `ENOTFOUND db.…supabase.co`, that's why; use the pooler.

## Verification performed

- `tsc --noEmit` clean; ESLint clean (except the one pre-existing `theme-toggle.tsx` warning).
- Server-rendered checks over HTTP: terms strip + share button + policy link on product pages;
  `/policies` renders all four sections; footer link present.
- Full lifecycle simulated in the DB and verified in rendered pages:
  COD label + "Mark as responded" on the admin card → `responded` shows "Mark as shipped" →
  `shipped` with tracking shows the customer timeline (all 4 steps, dates), the
  Delhivery/tracking line, the unboxing reminder, and the send-video button. Test data cleaned up.
- The payment dialog / ship dialog click-paths are hydration-dependent and were verified by
  code review + typecheck only (the preview pane was hidden during testing, which throttles
  the browser): worth a 2-minute manual click-through — Buy Now → payment dialog → WhatsApp
  message contains payment + acknowledgment lines; admin → Mark as shipped → tracking saved.

## Deliberately NOT built (and why)

- **Cashback / flat discounts / loyalty points with monetary value** — they come straight out
  of the reseller's per-order commission.
- **Referral credits** — same margin problem in cash form; revisit later as a *gift-with-order*
  (e.g., free fall-pico or a blouse-piece upgrade for a successful referral) which costs far
  less than its perceived value. Needs the credit-ledger groundwork if ever pursued.
- **Coupon engine / third-party affiliate networks** — overkill and fee-laden for a
  single-admin store.

## Sensible next steps (when ready)

1. **Gift-with-order referrals** — non-cash rewards preserve commission (see above).
2. **"Ask about this saree" WhatsApp button** on product pages for pre-sale questions —
   conversations convert; the no-return policy makes pre-sale Q&A extra valuable.
3. **Back-in-stock / price-drop wishlist alerts** — highest-intent nudges; blocked on the
   Brevo API key (see QA-REVIEW-FIXES.md P0-1).
4. **Delivered → review nudge**: once an order is `delivered`, prompt for a photo review on
   the product page visit — feeds social proof without paying for it.
