# Loyalty, Referrals & Engagement System

> **Implemented & verified: 19 Jul 2026.** A global loyalty-points program with anti-abuse
> guarantees, referral tracking, checkout redemption, new-product email blasts, a full admin
> panel, and a WhatsApp message audit log. Point values are admin-configurable — the defaults
> below can be changed at **Admin → Loyalty** without a deploy.

## Configurable defaults (Admin → Loyalty → Program settings)

| Setting | Default | Meaning |
|---|---|---|
| Welcome points | **10** | Granted once on first registration |
| Review points | **2** | Per **approved** review rated ≥ minimum |
| Minimum review rating | **3** | Stars required to earn review points |
| Referral points | **5** | To the referrer when their referral's first order is **delivered** |
| Orders per milestone | **3** | Delivered orders needed for a bonus |
| Milestone points | **25** | Bonus each time the milestone is reached |
| Point value (₹) | **1** | Rupee value of 1 point at checkout |

---

## How points are earned

1. **Welcome — 10 pts, once.** Awarded in `signUp` ([auth.ts](src/actions/auth.ts)); guarded so it
   can never be granted twice per account.
2. **Reviews — 2 pts on approval, rating ≥ 3.** Awarded in `moderateReview` when an admin approves
   ([reviews.ts](src/actions/reviews.ts)). Moderation is the abuse gate — points only exist after a
   human approves. **Full anti-abuse handling (all verified):**
   - *Multiple reviews on the same product earn once only* — a `review_rewards(user, product)` guard
     row blocks re-awarding.
   - *Deleting a review removes the 2 points* — revocation posts a negative ledger row.
   - *A review can't be deleted once its points are spent* — the customer-facing delete
     (`deleteOwnReview`) enforces the balance and returns a clear message; admin deletion always
     claws points back even into negative.
   - *Delete-and-repost to farm points is impossible* — the guard only re-arms if the previous reward
     was explicitly revoked.
3. **Referral — 5 pts.** Shared product links carry the sharer's `?ref=CODE`; the proxy stores it in
   a 30-day cookie, and `signUp` attaches the new user to the referrer. The referrer is paid when the
   referred customer's **first order is delivered** (`processDeliveredOrder`), and the referral flips
   `pending → rewarded`. Self-referrals and unknown codes are ignored.
4. **Orders milestone — 25 pts every 3 delivered orders.** Also in `processDeliveredOrder`, counted
   against delivered totals so it's **idempotent** — re-processing a delivery never double-awards.

## How points are redeemed

- At checkout (the payment step, [payment-choice.tsx](src/components/products/payment-choice.tsx)),
  customers with points see their balance and an input to choose how many to use, capped at both
  their balance and the order value. The discount (`points × point_value`) is shown live.
- The redemption is written into the WhatsApp order message ("Redeeming: 50 loyalty points (−₹50)")
  and **validated server-side against the ledger** in `createInquiry` — a tampered client can't spend
  points it doesn't have. The negative ledger row is the deduction.
- If an order is **cancelled**, redeemed points are refunded automatically (idempotent).

## Product-launch emails

- When a product is **first published**, `after()` fires `sendNewProductAnnouncement`
  ([product-notifications.ts](src/lib/product-notifications.ts)) so the admin's save is never blocked.
- Interactive HTML email ([product-announcement.ts](src/emails/product-announcement.ts)) with the
  saree image, price, and a "View this saree" button, sent to all customers with a **verified email**.
- **Announced at most once per product**, ever: the send atomically claims the row by flipping
  `products.notified_at` from NULL, so edits/re-publishes never re-blast. Capped at 200 recipients
  per send to stay inside Brevo's free tier.
- ⚠️ Depends on a working Brevo key (QA-REVIEW-FIXES.md P0-1). Currently no customers have verified
  emails, so a send is a safe no-op until real customers verify.

## Admin panel (Admin → Loyalty)

- **Program settings** — edit all point values live.
- **Customer balances** — every customer, sorted by balance (earned − redeemed). Admins are excluded.
- **Recent transactions** — the full ledger: earned, redeemed, revoked, refunded, with who and why.
- **Referral history** — who referred whom and pending/rewarded status.
- **Point balance on every inquiry card** (Admin → Inquiries) so redemptions can be applied in chat.

## WhatsApp message audit log (Admin → Messages)

- Every system-generated WhatsApp message (orders, product shares, order re-opens, unboxing-video
  sends) is stored in `whatsapp_logs` and shown in an expandable audit list with sender, kind, full
  message, timestamp, and status.
- **On delivery status:** wa.me deep links carry no delivery receipts — that requires the paid
  WhatsApp Business API. The recorded status is that the message link was generated/opened; the UI
  states this explicitly so it isn't mistaken for a delivery confirmation. Wiring up the Business API
  later would let this column show real sent/delivered/read states.

## Customer-facing (My Account)

- A **Loyalty Points** card: balance + ₹ value, referral code with copy-link button, and recent
  activity. Points are redeemable at any checkout.

## Data model — migration [014](supabase/migrations/014_loyalty_referrals_and_whatsapp_log.sql) (applied)

- `loyalty_settings` (single config row) · `loyalty_transactions` (append-only ledger; balance = SUM)
- `review_rewards` (per-user-per-product reward guard) · `referrals` (referrer→referred, status)
- `profiles.referral_code` (unique, backfilled) + `referred_by` · `inquiries.points_redeemed`
- `products.notified_at` (announcement guard) · `whatsapp_logs` (audit)
- RLS: customers read only their own ledger/referrals; admins read all; **all writes go through the
  service role** (server actions) so earning rules can't be forged from the browser.

## Verification performed

- `tsc --noEmit` clean; ESLint clean except the one pre-existing `theme-toggle.tsx` warning.
- Server-rendered (SSR over HTTP with a fresh admin session): account loyalty card (balance, referral
  code, activity), admin loyalty page (settings form, balances table with admins excluded, ledger,
  referral history), admin WhatsApp audit log, referral code embedded in product share links.
- **Logic tested end-to-end against the live DB** (test users created and deleted afterward):
  - Referral pays +5 once on first delivery; status → rewarded.
  - Milestone pays +25 per 3 deliveries (35 → 60); **re-processing a delivery does not double-award.**
  - Review: ≥3★ earns +2; second review on same product earns nothing; delete removes points;
    delete-after-spend is blocked.
  - Redemption: over-balance rejected; redeem deducts; cancel refunds; refund is idempotent.
- All test data cleaned up (only the owner account remains; ledger empty).

## Order/status tracking

The requirement for order/project status tracking was already delivered in the previous phase — the
customer timeline (Confirmed → Shipped → Delivered) in My Account and the admin lifecycle with
tracking numbers. See RESELLER-FEATURES.md.

## Blocked on you / next steps

1. **Brevo API key** (`xkeysib-…`, not the SMTP key) + verified sender — required before product
   emails and any email actually send. See QA-REVIEW-FIXES.md P0-1.
2. **Manual click-through** (2 min) once the preview browser is available: checkout redeem input →
   WhatsApp message shows the redemption line; My Account → copy referral link; delete an approved
   review whose points are spent → blocked with the message.
3. Optional later: WhatsApp Business API to upgrade the audit log's status to real delivery receipts;
   points **expiry** (the ledger already has a slot for it — add an `expired` transaction type + a
   scheduled job).
