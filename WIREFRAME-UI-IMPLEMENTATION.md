# Wireframe UI/UX Implementation

> **Implemented & verified: 19 Jul 2026.** Source: `C:\Users\Gautam Paliwal\Downloads\Sapana Saree Wireframes`.

## What was in the wireframe folder

Only **Section 1 — Storefront Public** had been exported (`1. Storefront Public.dc.html`,
883 lines) plus five shared component wireframes (`Header`, `Footer`, `ProductCard`,
`CategoryTile`, `WhatsAppFab`) and a generic `WireBox` primitive used to compose them.
Sections 2–5 from the original wireframe prompt (Authentication, Account, Checkout
modals, Admin) were **not** present — the tool's own closing note in the file says
*"Say 'continue' for Section 2 (Authentication) next"*, confirming generation stopped
after Section 1.

**Scope of this pass, accordingly:**
- All 10 Section 1 screens were rebuilt to match the wireframe, at mobile (375px),
  tablet (768px), and desktop (1440px) — using Tailwind's existing sm/md/lg breakpoints
  rather than introducing new ones.
- The wireframe's palette, shape, and spacing language was extracted into the app's
  shared design tokens (see below), which — because every shadcn/ui primitive in this
  app is token-driven — automatically re-themes auth, account, and admin pages too, even
  though those sections have no wireframe of their own yet. Their *layouts* were left
  untouched; only their colors/shape now match the new system.

## Design tokens (`src/app/globals.css`)

The wireframe is a grayscale tool, but its ink color, paper color, and border grays were
consistent enough to trace into a real palette:

| Token | Old | New |
|---|---|---|
| `--primary` | pink/magenta (oklch hue 358) | near-black (`oklch(0.17 0.004 85)`) — matches the wireframe's solid-filled buttons |
| `--background` | near-white, slight warm cast | warm off-white (`oklch(0.975 0.003 85)`), traced from the wireframe's `#f7f6f3` page color |
| `--border` / `--input` | light pink-tinted gray | warm neutral gray (`oklch(0.88 0.005 85)`), traced from `#d3d1cb` |
| `--muted-foreground` | — | warm mid-gray (`oklch(0.48 0.006 85)`), traced from `#6b6a66` |
| `--radius` | `0.625rem` (10px, quite rounded) | `0.3rem` (~5px) — sharper, closer to the wireframe's largely-square boxes, without going fully 0 (which would break floating overlays like dialogs/dropdowns) |

Dark mode was rebuilt as the inverse of the same neutral palette (previously it kept the
pink hue at a different lightness) so toggling themes stays coherent with the new look.
`--destructive` (error red) was **left unchanged** — the wireframe has no error states to
trace, and this is a safety-critical semantic color, not a brand color.

Verified live in the browser via `getComputedStyle` in both themes (not just by reading
the source): light-mode `--background` resolves to ~97% lightness, `--primary` to ~4%
(near-black), with a consistently low, warm chroma across every token — no leftover
pink signature anywhere in the compiled stylesheet.

## Per-screen changes

1. **Header** — three real layouts, not one collapsed into media queries as an
   afterthought: mobile (hamburger + centered logo + icon cluster), tablet (logo +
   inline search + condensed "Sarees / Categories" nav + icons), desktop (logo + full
   5-link nav + search + icons). Icon buttons became outlined circles per the wireframe.
   The hamburger stays available through tablet (not just mobile) so every page remains
   reachable at every width — the wireframe's tablet frame omits it, but taking that
   literally would have made About/Contact/the account menu unreachable at that size.
   Dark-mode toggle was kept (existing feature) even though the wireframe's icon count
   doesn't show one.
2. **Footer** — mobile now uses a native `<details>` accordion (Quick Links, Customer
   Care), tablet is a 2-column grid + bottom bar, desktop keeps the existing 4-column
   layout, just retoned.
3. **ProductCard** — added a circular wishlist toggle overlaid on the image corner (the
   wireframe shows this on every card, not just the detail page). It's a **new, separate
   component** (`ProductCardWishlistToggle`) that reuses the exact same
   `addToWishlist`/`removeFromWishlist` server actions as the detail page's button, so
   the already-verified full-width button was never touched. Discount/sold-out badges
   became monochrome-outlined; the redundant "Free Delivery" line was dropped (it's
   already communicated store-wide via the trust badges). Grid base column count changed
   from 1 to 2 to match the wireframe's mobile 2-up layout everywhere it's used.
   *Known limitation:* the toggle's initial state defaults to "not saved" in generic
   product grids (home, search, related products) — only the Wishlist page itself knows
   the true state for every card. Clicking it on an already-saved item is harmless (the
   `addToWishlist` action already treats a duplicate as a no-op success), just not
   visually accurate on first paint. Wiring accurate bulk wishlist state into every grid
   context was judged out of scope for a presentation-layer pass.
4. **Home page** — reordered to Hero → Categories → Deals → Featured Products → Trust
   badges → WhatsApp CTA (previously trust badges sat right under the hero). Trust
   badges became an outlined pill row instead of a 4-box icon grid. Hero's gradient/pink
   accents were flattened to neutral; its extra content (subtitle, secondary CTA, trust
   checkmarks) was kept since it's real value the wireframe simply abbreviated, not
   something the wireframe says to remove.
5. **All Sarees listing** — added a **Category** filter dropdown, reusing
   `getProducts()`'s existing `category` parameter (already implemented, just never
   exposed in this UI) — no new backend logic. A **Color** filter was *not* added: the
   product schema has no color filter support server-side, and inventing that would have
   gone beyond "match the visuals," so Material/Occasion/Price remain the other filters.
   Filter sidebar/drawer restyled to the bordered dropdown-box look.
6. **Product Detail** — gallery thumbnails now sit in a left column beside the main
   image on tablet/desktop (flex `order` + `sm:flex-row`), collapsing to a row below the
   image on mobile — previously thumbnails were always a row below, on every size.
   Material/Color/Occasion became pill chips instead of a label/value grid. Order terms
   became a dashed-border box of pill chips instead of a plain icon list.
7. **Categories / Category detail** — category cards now show an image area
   (`category.image_url`, already a schema field, previously unused in this UI) with a
   graceful emoji fallback when unset, matching the wireframe's card variant. Category
   detail intentionally does **not** get its own category-switcher dropdown (it's
   already scoped by URL segment; reusing the generic filter component there would have
   pushed a `category=` query param onto the wrong route).
8. **Search** — landing/results/no-results states already existed from a prior phase;
   this pass added a "Browse All Sarees" CTA button to the no-results state (via a new
   optional `actionLabel`/`actionHref` prop on the shared `EmptyState` component).
9. **Wishlist** — same `EmptyState` extension, "Explore Sarees" CTA; every card on this
   page correctly passes `wishlisted={true}` since that's definitionally accurate here.
10. **About** — added two placeholder image blocks (bordered, muted, with a caption)
    since the page had no imagery at all; all existing copy preserved verbatim.
11. **Contact** — split into a 2-column layout at `sm`+ (form + a WhatsApp-first info
    column), stacked on mobile; the existing `ContactForm` component is unchanged.
12. **Policies** — added a 4-step order timeline and a native-`<details>` FAQ accordion
    (the wireframe's exact four questions), answered from the existing
    `DELIVERY_ESTIMATE`/`COD_CHARGE` constants — no new content invented. The four
    existing policy sections (Delivery/Payment/No-returns/Unboxing) were kept, just
    retoned to square borders.

## Deliberately unchanged

- **Auth pages, Account pages, Admin panel** — no wireframe exists for these yet
  (Sections 2–5 were never generated). They inherit the new color/shape tokens
  automatically but were not restructured. If wireframes for those sections are
  exported later, they can go through the same process.
- **All server actions, queries, and business logic** — every edit in this pass was
  either a JSX/className change or a new *reuse* of an already-existing capability
  (category filtering, image_url, wishlist actions, EmptyState). No API route, database
  query, or workflow was altered.

## Verification performed

- `tsc --noEmit` clean; `eslint` clean except one pre-existing, unrelated warning in
  `theme-toggle.tsx` that predates this work.
- All 10 screens fetched over HTTP (fresh server, cold-compiled) — all `200`, each
  checked for its specific new markup (category dropdown, dashed order-terms box,
  category image box, FAQ questions, timeline steps, etc.).
- Design tokens verified live via `getComputedStyle` in both light and dark mode — no
  leftover pink hue anywhere in the compiled stylesheet.
- Header's three responsive states verified via computed `display` at 375/768/1440px
  (not just class names) — hamburger, condensed nav, and full nav each show/hide exactly
  as designed at the right width.
- Product gallery's tablet/desktop reflow verified via computed CSS `order` values.
- Footer accordion and Policies FAQ accordion both verified to actually open/close on
  click (native `<details>`, no JS framework needed).
- One transient false alarm during this pass: a stale Turbopack dev-cache served an old,
  pre-fix client bundle after a mid-session edit, surfacing a `ReferenceError` in the
  console log. Confirmed via direct `fetch()` that the flagged chunk no longer exists on
  the rebuilt server and via direct DOM inspection that the live page renders correctly
  with no error boundary triggered — the error was leftover console history, not a live
  bug. Noting it here since it's the same class of environment quirk documented in
  `QA-REVIEW-FIXES.md` (slow filesystem occasionally corrupting `.next/dev`); the fix is
  the same: stop the server, `rm -rf .next`, restart.

## Suggested next step

If you export Section 2 (Authentication) and beyond from the same wireframe tool, drop
the new files in the same folder and this can be repeated for those screens — the design
tokens are already in place, so that pass would be pure layout work.
