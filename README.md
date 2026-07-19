# Sapana Saree

A full-stack e-commerce storefront for a saree reseller business. Customers browse and
search the catalog on the site; orders themselves are confirmed over WhatsApp rather than
an online checkout, matching how the business actually operates (a reseller earning
commission, not a warehouse that can process refunds/returns).

## Features

**Storefront**
- Product catalog with categories, filters, sorting, and full-text search
- Product detail pages with an image gallery, reviews, and related products
- "Buy Now" flow that opens a pre-filled WhatsApp message instead of a checkout form
- Wishlist, user accounts, and order/inquiry history
- Loyalty points: welcome bonus, review rewards, referral rewards, and milestone bonuses —
  redeemable against an order — all admin-configurable without a deploy
- Username-based auth (no email required to sign up); email is optional and only used for
  verification / password recovery

**Admin panel**
- Product & category CRUD with drag-to-reorder multi-image upload (Cloudinary)
- Review moderation, inquiry/order tracking, contact messages
- Loyalty program configuration and a WhatsApp activity log
- Role-gated (`admin` / `super_admin`) on top of Postgres Row Level Security, so access is
  enforced at the database layer even if a UI check is bypassed

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack), React 19, TypeScript |
| Database & Auth | Supabase (Postgres + Row Level Security) |
| Image storage | Cloudinary (falls back to local disk in dev if unconfigured) |
| Transactional email | Brevo (verification links, password reset) |
| UI | Tailwind CSS v4, shadcn/ui (Base UI primitives) |
| State | Zustand |
| Forms & validation | React Hook Form + Zod |

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.local.example` to `.env.local` and fill in your Supabase, Cloudinary, and
   Brevo credentials.
3. Apply the database schema:
   ```bash
   npm run db:migrate
   ```
4. Start the dev server:
   ```bash
   npm run dev
   ```
5. To make an account an admin, sign up normally, then set its role directly in the
   Supabase `profiles` table (`role = 'admin'` or `'super_admin'`) — see **Admin → Settings**
   in the app for the exact query.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run build` / `npm start` | Production build / start |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Apply `supabase/migrations/*.sql` to the DB in `.env.local` |
| `npm run db:seed` | Same, plus `supabase/seed.sql` |

## Project structure

```
src/
├── app/              # Routes (App Router)
│   ├── (storefront)/ # Public site — home, sarees, categories, account, etc.
│   ├── (auth)/        # Login / signup / password reset
│   ├── admin/         # Admin panel (role-gated)
│   └── api/           # Route handlers (uploads, webhooks, OG images)
├── actions/          # Server Actions (mutations invoked from the UI)
├── lib/               # Supabase clients, Cloudinary, Brevo, cached queries, helpers
├── components/        # UI components, grouped by feature area
├── hooks/ & stores/    # Client-side hooks and Zustand stores
└── emails/            # Email templates sent via Brevo
supabase/
└── migrations/        # Ordered, numbered SQL migrations — the source of truth for the schema
```

## Deployment notes

- Set every `NEXT_PUBLIC_*` variable in your hosting provider **before** the build runs —
  they're inlined at build time, so adding one afterward requires a rebuild.
- In Supabase → Authentication → URL Configuration, add your production domain to the
  redirect URL allow-list, or verification/reset links will keep resolving to whatever
  Site URL Supabase has on file.
- `.github/workflows/supabase-keepalive.yml` pings the database on a schedule so a
  free-tier Supabase project doesn't pause from inactivity.
