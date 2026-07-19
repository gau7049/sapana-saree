# Sapana Saree - E-Commerce Platform Architecture Plan

## Context

**Problem**: Build an e-commerce website for a saree store called "Sapana Saree" where customers browse products, view details, and place orders via WhatsApp. The store owner manages the catalog through an admin panel and handles orders manually through WhatsApp conversations.

**Key constraint**: Every technology must be 100% free or have a sufficient free tier. The only acceptable cost is an optional custom domain (~$10-12/year).

**Current state**: Empty git repository with only a README.md.

---

## 1. Technology Stack

| Layer | Technology | Why | Free Tier |
|-------|-----------|-----|-----------|
| **Framework** | Next.js (App Router) + TypeScript | SSR/SSG for SEO, API routes for backend, file-based routing, React Server Components | Unlimited |
| **UI Library** | Tailwind CSS + shadcn/ui | Utility-first CSS, accessible component primitives, no vendor lock-in, tree-shakeable | Unlimited |
| **Animations** | Framer Motion | Production-grade animations, layout animations, gesture support | Unlimited |
| **Database + Auth** | Supabase (PostgreSQL) | Managed PostgreSQL, built-in Auth (email/password, password reset), Row Level Security, real-time | 500MB DB, 1GB storage, 50K MAU |
| **Image CDN** | Cloudinary | On-the-fly image transforms (resize, format, quality), automatic WebP/AVIF delivery | 25 credits/month (~25GB) |
| **Email** | Resend | Modern email API, React email templates, reliable delivery | 3,000 emails/month |
| **State Management** | Zustand | Lightweight (~1KB), no boilerplate, perfect for filter/UI state | Unlimited |
| **Forms + Validation** | React Hook Form + Zod | Type-safe validation, minimal re-renders, schema reuse between client and server | Unlimited |
| **Hosting** | Netlify | Full Next.js SSR support, auto-deploy from GitHub, preview deploys, **commercial use allowed on free tier** | 100GB bandwidth, 300 build min/month |
| **WhatsApp** | wa.me URL redirect | Zero-cost, no API key needed, works on all devices | Unlimited |
| **CAPTCHA** | Cloudflare Turnstile | Privacy-friendly, invisible CAPTCHA for brute-force protection | Unlimited |
| **Analytics** | Umami (self-hosted on Supabase) or Plausible | Privacy-friendly, no cookie banners needed | Free (self-hosted) |

**Why NOT Vercel?** Vercel's Hobby tier explicitly prohibits commercial use. Since this is a revenue-generating store, Netlify (which allows commercial use on its free tier) is the correct choice.

---

## 2. System Architecture

```
                                    +------------------+
                                    |   Cloudinary     |
                                    |   (Image CDN)    |
                                    +--------^---------+
                                             |
+----------+     +-----------+     +---------+---------+     +------------------+
|  Browser  | --> |  Netlify  | --> |   Next.js App     | --> |    Supabase      |
| (Client)  |     |  (Edge)   |     | (Server Actions,  |     | (PostgreSQL +    |
|           | <-- |  (CDN)    | <-- |  Route Handlers,  | <-- |  Auth + RLS)     |
+----------+     +-----------+     |  RSC, ISR)        |     +------------------+
                                    +---------+---------+
                                              |
                                    +---------v---------+
                                    |     Resend        |
                                    |  (Email Service)  |
                                    +-------------------+
```

**Rendering Strategy:**

| Page | Strategy | Revalidation |
|------|----------|-------------|
| Homepage | ISR | 1 hour |
| Product listing | ISR | 1 hour |
| Product detail | ISR | 30 minutes |
| Category pages | ISR | 1 hour |
| Search results | SSR (dynamic) | N/A |
| Auth pages | Static | N/A |
| Admin pages | SSR (dynamic, no-store) | N/A |
| About/Contact | Static | N/A |

On-demand revalidation: When admin updates a product, call `revalidatePath()` and `revalidateTag()` to bust the cache immediately.

---

## 3. Database Schema

All tables in Supabase PostgreSQL with Row Level Security (RLS) enabled on every table.

### Enums

```sql
CREATE TYPE user_role AS ENUM ('customer', 'admin', 'super_admin');
CREATE TYPE product_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE review_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE inquiry_status AS ENUM ('sent', 'responded', 'completed', 'cancelled');
```

### Tables

#### profiles (extends Supabase auth.users)

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'customer' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);
```

Auto-created via database trigger on user signup.

#### categories (self-referencing for subcategories)

```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent ON categories(parent_id);
```

#### products

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  short_description TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  compare_at_price DECIMAL(10,2) CHECK (compare_at_price IS NULL OR compare_at_price >= 0),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  status product_status DEFAULT 'draft' NOT NULL,
  is_featured BOOLEAN DEFAULT false,
  material TEXT,
  color TEXT,
  occasion TEXT,
  work_type TEXT,
  avg_rating DECIMAL(2,1) DEFAULT 0,
  review_count INT DEFAULT 0,
  view_count INT DEFAULT 0,
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_featured ON products(is_featured) WHERE is_featured = true;
CREATE INDEX idx_products_created ON products(created_at DESC);

-- Full-text search index
CREATE INDEX idx_products_search ON products USING gin(
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(material, '') || ' ' || coalesce(occasion, ''))
);
```

#### product_images

```sql
CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  public_id TEXT NOT NULL,
  alt_text TEXT,
  sort_order INT DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  width INT,
  height INT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_product_images_product ON product_images(product_id);
```

#### reviews (one per user per product)

```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  status review_status DEFAULT 'pending' NOT NULL,
  admin_response TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(product_id, user_id)
);

CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_reviews_status ON reviews(status);
```

#### inquiries (WhatsApp order tracking)

```sql
CREATE TABLE inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  status inquiry_status DEFAULT 'sent' NOT NULL,
  whatsapp_message TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_inquiries_user ON inquiries(user_id);
CREATE INDEX idx_inquiries_product ON inquiries(product_id);
CREATE INDEX idx_inquiries_status ON inquiries(status);
CREATE INDEX idx_inquiries_created ON inquiries(created_at DESC);
```

#### wishlists

```sql
CREATE TABLE wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, product_id)
);

CREATE INDEX idx_wishlists_user ON wishlists(user_id);
```

#### contact_messages

```sql
CREATE TABLE contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_contact_messages_read ON contact_messages(is_read) WHERE is_read = false;
```

#### site_settings (key-value store for admin config)

```sql
CREATE TABLE site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
```

### Database Functions and Triggers

```sql
-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON inquiries FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Recalculate product avg_rating and review_count
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products SET
    avg_rating = (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE product_id = COALESCE(NEW.product_id, OLD.product_id) AND status = 'approved'),
    review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = COALESCE(NEW.product_id, OLD.product_id) AND status = 'approved')
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_product_rating();
```

### Row Level Security (RLS) Policies

```sql
-- Helper function: check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (is_admin());
CREATE POLICY "Admins can update all profiles" ON profiles FOR UPDATE USING (is_admin());

-- CATEGORIES (public read, admin write)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active categories" ON categories FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can view all categories" ON categories FOR SELECT USING (is_admin());
CREATE POLICY "Admins can manage categories" ON categories FOR ALL USING (is_admin());

-- PRODUCTS (public read published, admin full access)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view published products" ON products FOR SELECT USING (status = 'published');
CREATE POLICY "Admins can view all products" ON products FOR SELECT USING (is_admin());
CREATE POLICY "Admins can manage products" ON products FOR ALL USING (is_admin());

-- PRODUCT IMAGES
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view product images" ON product_images FOR SELECT USING (true);
CREATE POLICY "Admins can manage images" ON product_images FOR ALL USING (is_admin());

-- REVIEWS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view approved reviews" ON reviews FOR SELECT USING (status = 'approved');
CREATE POLICY "Users can view own reviews" ON reviews FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pending reviews" ON reviews FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');
CREATE POLICY "Admins can manage reviews" ON reviews FOR ALL USING (is_admin());

-- INQUIRIES
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own inquiries" ON inquiries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create inquiries" ON inquiries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage inquiries" ON inquiries FOR ALL USING (is_admin());

-- WISHLISTS
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own wishlists" ON wishlists FOR ALL USING (auth.uid() = user_id);

-- CONTACT MESSAGES
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can create messages" ON contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage messages" ON contact_messages FOR ALL USING (is_admin());

-- SITE SETTINGS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read settings" ON site_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage settings" ON site_settings FOR ALL USING (is_admin());
```

---

## 4. API Architecture

### Server Actions (mutations from UI)

```
src/actions/
  auth.ts          -- signUp, signIn, signOut, resetPassword, updatePassword
  products.ts      -- createProduct, updateProduct, deleteProduct, toggleFeatured
  categories.ts    -- createCategory, updateCategory, deleteCategory
  reviews.ts       -- createReview, updateReview, moderateReview
  inquiries.ts     -- createInquiry, updateInquiryStatus
  wishlists.ts     -- addToWishlist, removeFromWishlist
  contact.ts       -- submitContactForm
  images.ts        -- uploadImage, deleteImage, reorderImages
  settings.ts      -- updateSiteSetting
  profile.ts       -- updateProfile
```

### Route Handlers (external integrations, webhooks)

```
src/app/api/
  images/upload/route.ts     -- POST: Cloudinary signed upload
  images/delete/route.ts     -- DELETE: Remove from Cloudinary
  contact/route.ts           -- POST: Contact form + send email via Resend
  revalidate/route.ts        -- POST: On-demand ISR revalidation webhook
  health/route.ts            -- GET: Health check (used by anti-pause cron)
  og/route.ts                -- GET: Dynamic OG image generation
```

### Data Fetching Functions (Server Components)

```
src/lib/queries/
  products.ts      -- getProducts, getProductBySlug, getRelatedProducts, searchProducts, getFeaturedProducts
  categories.ts    -- getCategories, getCategoryBySlug, getCategoryTree
  reviews.ts       -- getProductReviews, getUserReviews
  inquiries.ts     -- getUserInquiries, getAllInquiries (admin)
  wishlists.ts     -- getUserWishlist
  stats.ts         -- getDashboardStats, getTopProducts (admin)
  profile.ts       -- getProfile
```

---

## 5. Folder Structure

```
sapana-saree/
├── .github/workflows/
│   └── supabase-keepalive.yml          # Cron ping to prevent Supabase pausing
├── public/
│   ├── fonts/                          # Self-hosted fonts
│   └── images/                         # Static assets (logo, placeholders)
├── src/
│   ├── app/
│   │   ├── (storefront)/               # Customer-facing pages
│   │   │   ├── layout.tsx              # Header + Footer
│   │   │   ├── page.tsx                # Homepage
│   │   │   ├── sarees/
│   │   │   │   ├── page.tsx            # Product listing (filters, sort, search)
│   │   │   │   └── [slug]/page.tsx     # Product detail
│   │   │   ├── categories/[slug]/page.tsx
│   │   │   ├── search/page.tsx
│   │   │   ├── wishlist/page.tsx
│   │   │   ├── account/               # Profile, inquiry history, user reviews
│   │   │   │   ├── page.tsx
│   │   │   │   ├── inquiries/page.tsx
│   │   │   │   └── reviews/page.tsx
│   │   │   ├── about/page.tsx
│   │   │   └── contact/page.tsx
│   │   ├── (auth)/                     # Auth pages (centered layout)
│   │   │   ├── layout.tsx
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   ├── forgot-password/page.tsx
│   │   │   └── reset-password/page.tsx
│   │   ├── admin/                      # Admin panel (sidebar layout)
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx                # Dashboard
│   │   │   ├── products/
│   │   │   │   ├── page.tsx            # Product list
│   │   │   │   ├── new/page.tsx        # Create product
│   │   │   │   └── [id]/edit/page.tsx  # Edit product
│   │   │   ├── categories/page.tsx
│   │   │   ├── reviews/page.tsx
│   │   │   ├── inquiries/page.tsx
│   │   │   ├── messages/page.tsx
│   │   │   └── settings/page.tsx
│   │   ├── api/
│   │   │   ├── images/
│   │   │   │   ├── upload/route.ts
│   │   │   │   └── delete/route.ts
│   │   │   ├── contact/route.ts
│   │   │   ├── revalidate/route.ts
│   │   │   ├── health/route.ts
│   │   │   └── og/route.ts
│   │   ├── auth/callback/route.ts      # Supabase auth callback
│   │   ├── sitemap.ts
│   │   ├── robots.ts
│   │   ├── layout.tsx                  # Root layout
│   │   ├── loading.tsx
│   │   ├── not-found.tsx
│   │   └── error.tsx
│   ├── actions/                        # Server Actions
│   │   ├── auth.ts
│   │   ├── products.ts
│   │   ├── categories.ts
│   │   ├── reviews.ts
│   │   ├── inquiries.ts
│   │   ├── wishlists.ts
│   │   ├── contact.ts
│   │   ├── images.ts
│   │   ├── settings.ts
│   │   └── profile.ts
│   ├── components/
│   │   ├── ui/                         # shadcn/ui components
│   │   ├── layout/
│   │   │   ├── header.tsx
│   │   │   ├── footer.tsx
│   │   │   ├── mobile-nav.tsx
│   │   │   ├── admin-sidebar.tsx
│   │   │   └── theme-toggle.tsx
│   │   ├── products/
│   │   │   ├── product-card.tsx
│   │   │   ├── product-grid.tsx
│   │   │   ├── product-filters.tsx
│   │   │   ├── product-sort.tsx
│   │   │   ├── product-gallery.tsx
│   │   │   ├── product-info.tsx
│   │   │   ├── product-reviews.tsx
│   │   │   ├── related-products.tsx
│   │   │   ├── buy-now-button.tsx
│   │   │   └── wishlist-button.tsx
│   │   ├── categories/
│   │   │   ├── category-card.tsx
│   │   │   └── category-nav.tsx
│   │   ├── auth/
│   │   │   ├── login-form.tsx
│   │   │   ├── signup-form.tsx
│   │   │   ├── forgot-password-form.tsx
│   │   │   └── auth-guard.tsx
│   │   ├── admin/
│   │   │   ├── dashboard-stats.tsx
│   │   │   ├── product-form.tsx
│   │   │   ├── category-form.tsx
│   │   │   ├── image-upload.tsx
│   │   │   ├── review-moderator.tsx
│   │   │   ├── inquiry-table.tsx
│   │   │   └── data-table.tsx
│   │   ├── home/
│   │   │   ├── hero-section.tsx
│   │   │   ├── featured-products.tsx
│   │   │   ├── category-showcase.tsx
│   │   │   ├── testimonials.tsx
│   │   │   └── newsletter-signup.tsx
│   │   └── shared/
│   │       ├── search-bar.tsx
│   │       ├── pagination.tsx
│   │       ├── breadcrumbs.tsx
│   │       ├── empty-state.tsx
│   │       ├── loading-skeleton.tsx
│   │       ├── star-rating.tsx
│   │       ├── price-display.tsx
│   │       ├── whatsapp-fab.tsx
│   │       └── structured-data.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts               # Browser Supabase client
│   │   │   ├── server.ts               # Server Supabase client
│   │   │   ├── admin.ts                # Service role client (server only)
│   │   │   └── middleware.ts           # Auth middleware helper
│   │   ├── cloudinary/
│   │   │   ├── config.ts
│   │   │   └── upload.ts
│   │   ├── resend/
│   │   │   └── client.ts
│   │   ├── queries/
│   │   │   ├── products.ts
│   │   │   ├── categories.ts
│   │   │   ├── reviews.ts
│   │   │   ├── inquiries.ts
│   │   │   ├── wishlists.ts
│   │   │   └── stats.ts
│   │   ├── validators/
│   │   │   ├── product.ts
│   │   │   ├── category.ts
│   │   │   ├── review.ts
│   │   │   ├── auth.ts
│   │   │   └── contact.ts
│   │   ├── utils.ts
│   │   ├── constants.ts
│   │   ├── whatsapp.ts
│   │   └── seo.ts
│   ├── hooks/
│   │   ├── use-auth.ts
│   │   ├── use-wishlist.ts
│   │   ├── use-debounce.ts
│   │   ├── use-media-query.ts
│   │   └── use-intersection-observer.ts
│   ├── stores/
│   │   ├── auth-store.ts
│   │   ├── filter-store.ts
│   │   └── ui-store.ts
│   ├── types/
│   │   ├── database.ts                 # Supabase generated types
│   │   ├── product.ts
│   │   ├── category.ts
│   │   └── index.ts
│   ├── emails/
│   │   ├── password-reset.tsx
│   │   ├── contact-notification.tsx
│   │   └── welcome.tsx
│   └── middleware.ts                   # Next.js middleware (auth + admin guard)
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql
│       ├── 002_rls_policies.sql
│       ├── 003_functions_triggers.sql
│       └── 004_seed_admin.sql
├── .env.local.example
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## 6. Authentication Design

**Provider**: Supabase Auth (email/password with email confirmation)

### Auth Flows

**Signup:**
```
User fills signup form
  -> Server Action: supabase.auth.signUp({ email, password, data: { full_name } })
  -> Supabase sends confirmation email
  -> User clicks link -> /auth/callback -> validates token -> redirects to /
  -> Trigger auto-creates profile row with role='customer'
```

**Login:**
```
User fills login form
  -> Server Action: supabase.auth.signInWithPassword({ email, password })
  -> Session cookie set (httpOnly, secure)
  -> Redirect to previous page (or /)
```

**Password Reset:**
```
User enters email on /forgot-password
  -> Server Action: supabase.auth.resetPasswordForEmail(email, { redirectTo })
  -> Supabase sends reset email
  -> User clicks link -> /auth/callback -> /reset-password
  -> User enters new password
  -> Server Action: supabase.auth.updateUser({ password })
```

**Session Management:**
- Next.js middleware refreshes Supabase session on every request
- httpOnly secure cookie for session storage

### RBAC (3 Roles)

| Role | Access |
|------|--------|
| `customer` | Browse, wishlist, reviews, inquiries, own profile |
| `admin` | All customer + product/category CRUD, review moderation, inquiry management, dashboard |
| `super_admin` | All admin + manage other admins, site settings |

**First admin creation**: Sign up normally, then run one-time SQL in Supabase SQL editor:
```sql
UPDATE profiles SET role = 'super_admin' WHERE email = 'owner@example.com';
```

### Protection Layers (Defense in Depth)

1. **Next.js Middleware** (edge): Blocks unauthenticated users from protected routes, checks admin role for `/admin/*`
2. **Server Actions**: Each action independently verifies auth and role before executing
3. **RLS Policies** (database): Even if layers 1-2 are bypassed, database enforces access control

---

## 7. Admin Panel Design

**Layout**: Sidebar navigation with collapsible menu on mobile, integrated at `/admin` route within the same Next.js app.

### Pages

- **Dashboard**: Cards showing total products, active inquiries, pending reviews, total users. Charts for inquiry trends over time, top products by inquiries.
- **Products**: Data table with search, filter by status/category. Create/Edit form with title, slug (auto-generated), description (markdown editor), pricing, category selection, status toggle, SEO fields. Multi-image upload with drag-and-drop reordering.
- **Categories**: Tree view showing parent/child relationships. Inline editing, reordering, toggle active/inactive.
- **Reviews**: Table with filter by status (pending/approved/rejected). Quick approve/reject actions. Admin can add response to reviews.
- **Inquiries**: Table showing all WhatsApp inquiries with status pipeline (sent -> responded -> completed/cancelled). Admin can add notes.
- **Messages**: Contact form submissions with read/unread status.
- **Settings**: Site configuration (store name, WhatsApp number, about text, etc.) stored in site_settings table.

---

## 8. WhatsApp Integration Strategy

### Buy Now Flow

```
User clicks "Buy Now" on product page
  -> Check auth state (client-side via Zustand)
  -> If NOT authenticated: redirect to /login?redirect=/sarees/[slug]
  -> If authenticated:
     1. Server Action: createInquiry() logs inquiry to database
     2. Build WhatsApp URL:
        https://wa.me/{WHATSAPP_NUMBER}?text={encoded message}
     3. Message includes:
        - Product title
        - Category
        - Price (formatted in INR)
        - Product ID
        - User name
        - User phone
     4. window.open(whatsappUrl, '_blank')
     5. Show toast: "Opening WhatsApp... Your inquiry has been recorded."
```

### WhatsApp Message Template

```
Hello! I'm interested in buying a saree from Sapana Saree.

Product: {product.title}
Category: {category.name}
Price: Rs. {product.price}
Product ID: {product.id}

My Name: {user.full_name}
My Phone: {user.phone}

Please share availability and delivery details.
```

### Floating WhatsApp Button

- `<WhatsAppFAB />` fixed to bottom-right on all pages
- Generic message: "Hi! I'm browsing Sapana Saree and have a question."
- Appears after 3 seconds with slide-in animation, dismissable

### Admin Inquiry Tracking

- All inquiries logged in `inquiries` table with status pipeline
- Admin can track which products get the most inquiries
- Admin can update status (sent -> responded -> completed/cancelled) and add notes

---

## 9. Image Storage Strategy

### Upload Pipeline (Admin)

1. **Client validation**: JPEG/PNG/WebP only, max 5MB per image, max 8 images per product
2. **Client preview**: `URL.createObjectURL()` for instant preview
3. **Upload**: POST to `/api/images/upload` with FormData
4. **Server processing**: Generate Cloudinary signed upload params, upload with eager transforms:
   - Thumbnail: `c_thumb,w_300,h_400,g_auto/f_auto,q_auto`
   - Card: `c_fill,w_600,h_800,g_auto/f_auto,q_auto`
   - Detail: `c_limit,w_1200,h_1600/f_auto,q_auto`
   - Zoom: `c_limit,w_2000/f_auto,q_auto`
5. **Database**: Save URL + `public_id` to `product_images` table
6. **Reordering**: Drag-and-drop updates `sort_order` field

### Display Optimization

- Cloudinary URL transforms: `f_auto` (WebP/AVIF), `q_auto` (quality), `g_auto` (smart crop)
- Set `unoptimized: true` in `next.config.ts` — let Cloudinary handle all optimization, avoid consuming Netlify's image optimization quota
- Next.js `<Image>` component for lazy loading and responsive `srcSet`

### Deletion

- Admin removes image: delete from DB + Cloudinary API delete by `public_id` (frees storage credits)

### Cloudinary Credit Budget (25 credits/month)

For ~200 products with ~5 images each:
- Storage: ~500MB = ~0.5 credits
- Bandwidth (10K page views): ~8GB = ~8 credits
- Transforms: ~1,000/month = ~1 credit
- **Total: ~9.5 credits/month** — well within budget

---

## 10. SEO Strategy

- **Dynamic Metadata**: `generateMetadata()` on every page (title, description, OG tags, canonical URL)
- **Structured Data (JSON-LD)**:
  - Product pages: `Product` schema (name, price, availability, ratings)
  - Homepage: `Organization` + `WebSite` schema
  - Category pages: `CollectionPage` schema
  - Navigation: `BreadcrumbList` schema
- **Dynamic Sitemap**: `sitemap.ts` generating URLs for all published products and active categories
- **Robots**: `robots.ts` allowing `/`, disallowing `/admin/`, `/api/`, `/account/`
- **Dynamic OG Images**: `/api/og` route generates social sharing images with product title and image
- **SEO-Friendly URLs**: `/sarees/banarasi-silk-red-wedding` (slug-based, descriptive)
- **Self-hosted fonts**: Avoid render-blocking external font requests
- **ISR caching**: Static-like performance with fresh content

---

## 11. Security Checklist

| Threat | Mitigation |
|--------|-----------|
| **SQL Injection** | Supabase client uses parameterized queries; never construct raw SQL |
| **XSS** | React auto-escapes output; never use `dangerouslySetInnerHTML`; CSP headers |
| **CSRF** | Next.js Server Actions verify Origin header automatically |
| **Brute Force** | Supabase built-in rate limiting + Cloudflare Turnstile CAPTCHA after 3 failed attempts |
| **File Upload Vulns** | Server-side magic byte validation, 5MB limit, Cloudinary handles storage (no files on server), unique filenames |
| **Unauthorized Access** | Triple-layer: Middleware -> Server Action -> RLS policies |
| **Env Variable Leaks** | Secrets in `.env.local` (never committed); `.env.local.example` documents vars without values; `SUPABASE_SERVICE_ROLE_KEY` never exposed to client |
| **Security Headers** | `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`, `Content-Security-Policy`, `Permissions-Policy` via `next.config.ts` |

---

## 12. Deployment Plan

### Netlify Setup

- Connect GitHub repo -> auto-deploy on push to `main`
- Preview deploys on pull requests
- Environment variables in Netlify dashboard
- SSL auto-provisioned via Let's Encrypt
- `@netlify/plugin-nextjs` for full Next.js SSR support

### Supabase Anti-Pause Cron

GitHub Actions workflow runs every 3 days to prevent free-tier project pausing:

```yaml
# .github/workflows/supabase-keepalive.yml
name: Supabase Keepalive
on:
  schedule:
    - cron: '0 0 */3 * *'
  workflow_dispatch:

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Supabase
        run: |
          curl -s "${{ secrets.SUPABASE_URL }}/rest/v1/site_settings?select=key&limit=1" \
            -H "apikey: ${{ secrets.SUPABASE_ANON_KEY }}" \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}"
```

### Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx

RESEND_API_KEY=re_xxx

NEXT_PUBLIC_SITE_URL=https://sapanasaree.com
NEXT_PUBLIC_WHATSAPP_NUMBER=91XXXXXXXXXX
```

### Custom Domain (Optional, ~$10-12/year)

1. Purchase domain (e.g., sapanasaree.com)
2. Add to Netlify: Site settings -> Domain management -> Add custom domain
3. Configure DNS: point nameservers to Netlify or add CNAME
4. Netlify auto-provisions SSL via Let's Encrypt

---

## 13. Development Roadmap

### Phase 1: Foundation (Week 1-2) — MVP Skeleton

- Project init: Next.js + TypeScript + Tailwind + shadcn/ui
- Supabase setup: database schema, RLS policies, triggers
- Auth: signup, login, logout, forgot/reset password
- Root layout: header, footer, mobile nav, theme toggle (dark/light)
- Homepage: hero section with placeholder content
- Deploy to Netlify + GitHub Actions keepalive cron

### Phase 2: Product Catalog (Week 3-4)

- Product listing page with grid view
- Product detail page with image gallery
- Category pages and navigation
- Search (PostgreSQL full-text search)
- Filters (category, price range, material, occasion) + sorting
- Pagination, breadcrumbs, related products

### Phase 3: Admin Panel (Week 5-6)

- Admin layout with sidebar navigation
- Dashboard with statistics
- Product CRUD with multi-image Cloudinary upload
- Image reordering (drag-and-drop)
- Category/subcategory management
- Admin route protection (middleware + RLS)

### Phase 4: User Engagement (Week 7-8)

- WhatsApp "Buy Now" flow with inquiry tracking
- Inquiry management in admin panel
- Product reviews: submit, display, star ratings
- Review moderation in admin
- Wishlist functionality
- User account/profile page
- Contact form with Resend email notification
- Floating WhatsApp button

### Phase 5: Polish & SEO (Week 9-10)

- SEO: metadata, OG tags, structured data, sitemap, robots.txt
- Dynamic OG image generation
- Performance: Core Web Vitals optimization, Lighthouse audit
- Animations: page transitions, scroll animations, micro-interactions (Framer Motion)
- Accessibility audit (ARIA labels, keyboard nav, screen reader)
- Error pages (404, 500), loading skeletons
- Security headers and CSP

### Phase 6: Launch (Week 11)

- Seed database with real products (with store owner)
- Custom domain setup on Netlify
- Analytics integration (Umami or Plausible)
- Cross-browser and mobile testing
- Performance budget enforcement
- Go live

---

## 14. Cost Analysis

| Service | Free Tier Limits | Monthly Cost |
|---------|-----------------|-------------|
| **Netlify** (hosting) | 100GB bandwidth, 300 build min | **$0** |
| **Supabase** (DB + Auth) | 500MB DB, 1GB storage, 50K MAU | **$0** |
| **Cloudinary** (images) | 25 credits/month | **$0** |
| **Resend** (email) | 3,000 emails/month, 100/day | **$0** |
| **GitHub + Actions** | Unlimited repos, 2,000 Actions min | **$0** |
| **WhatsApp** (wa.me) | URL redirect | **$0** |
| **Cloudflare Turnstile** | Unlimited | **$0** |
| **TOTAL** | | **$0/month** |

Only potential cost: custom domain ~$10-12/year (optional, can use `*.netlify.app` subdomain for free).

---

## 15. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Supabase pauses after 7 days inactivity | Site goes down | GitHub Actions cron every 3 days; real traffic also prevents pausing |
| Cloudinary 25-credit limit exceeded | Image uploads blocked | Monitor usage, compress images before upload, fallback to Supabase Storage (1GB free) |
| Netlify 100GB bandwidth exceeded | Site throttled | Aggressive asset optimization; if exceeded, business is doing well enough to upgrade (~$19/mo) |
| Free tier features reduced by provider | Forced migration | No single-vendor lock-in; all services are replaceable |
| SEO competition in saree market | Low visibility | Long-tail keywords, local SEO, structured data, regular content |
| Single point of failure (Supabase) | Outage takes down site | ISR/SSG means cached pages still serve during brief outages; accept for MVP |

---

## 16. Future Scalability Path

- **Payment integration**: Add Razorpay when ready for online payments; `inquiries` table evolves into `orders`
- **Inventory management**: Add `stock_quantity` to products, low-stock alerts
- **Multi-language (i18n)**: Hindi + English using `next-intl`
- **Blog/Content marketing**: `posts` table for SEO content (styling tips, fabric guides)
- **Mobile app**: API layer can serve React Native with minimal changes
- **Paid tier upgrades when needed**:
  - Netlify Pro ($19/mo) — 1TB bandwidth
  - Supabase Pro ($25/mo) — 8GB DB, no pausing
  - Cloudinary Plus ($89/mo) — or migrate to Cloudflare R2 (10GB free)

---

## Verification Plan

After implementation, verify by:

1. **Auth flow**: Sign up, confirm email, login, forgot password, reset password, logout
2. **Product catalog**: Browse, search, filter, sort, view details, check related products
3. **Admin panel**: Login as admin, CRUD products with images, manage categories, moderate reviews, track inquiries
4. **Buy Now flow**: Click Buy Now as logged-out user (should redirect to login), then as logged-in user (should open WhatsApp with pre-filled message and log inquiry)
5. **SEO**: Check meta tags, OG tags, structured data (Google Rich Results Test), sitemap.xml, robots.txt
6. **Performance**: Lighthouse audit targeting 90+ on all Core Web Vitals
7. **Security**: Verify RLS blocks unauthorized access, test admin routes without admin role, check security headers
8. **Responsive**: Test on mobile (375px), tablet (768px), desktop (1440px) in both dark and light mode
9. **Cross-browser**: Chrome, Firefox, Safari, Edge
