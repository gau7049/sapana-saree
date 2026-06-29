-- ============================================================
-- Sapana Saree — Full Database Setup
-- Run this in Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- 1. PROFILES (linked to Supabase Auth)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  avatar_url text,
  role text not null default 'customer' check (role in ('customer', 'admin', 'super_admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create profile on sign-up
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- 2. CATEGORIES
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  parent_id uuid references categories(id) on delete set null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. PRODUCTS
create table products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  short_description text,
  price numeric not null check (price >= 0),
  compare_at_price numeric check (compare_at_price >= 0),
  category_id uuid references categories(id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  is_featured boolean not null default false,
  material text,
  color text,
  occasion text,
  work_type text,
  avg_rating numeric not null default 0,
  review_count int not null default 0,
  view_count int not null default 0,
  meta_title text,
  meta_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. PRODUCT IMAGES
create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  url text not null,
  public_id text not null,
  alt_text text,
  sort_order int not null default 0,
  is_primary boolean not null default false,
  width int,
  height int,
  created_at timestamptz not null default now()
);

-- 5. REVIEWS
create table reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  title text,
  comment text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_response text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6. INQUIRIES (WhatsApp orders)
create table inquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  status text not null default 'sent' check (status in ('sent', 'responded', 'completed', 'cancelled')),
  whatsapp_message text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 7. WISHLISTS
create table wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

-- 8. CONTACT MESSAGES
create table contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
alter table profiles enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table reviews enable row level security;
alter table inquiries enable row level security;
alter table wishlists enable row level security;
alter table contact_messages enable row level security;

-- Helper: check if current user is admin
create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles
    where id = (select auth.uid())
    and role in ('admin', 'super_admin')
  );
$$ language sql security definer set search_path = '';

-- PROFILES
create policy "Users can view own profile"
  on profiles for select using ((select auth.uid()) = id);
create policy "Users can update own profile"
  on profiles for update using ((select auth.uid()) = id);
create policy "Admins can view all profiles"
  on profiles for select using ((select is_admin()));

-- CATEGORIES (public read, admin write)
create policy "Anyone can view active categories"
  on categories for select using (true);
create policy "Admins can manage categories"
  on categories for all using ((select is_admin()));

-- PRODUCTS (public read published, admin all)
create policy "Anyone can view published products"
  on products for select using (status = 'published' or (select is_admin()));
create policy "Admins can manage products"
  on products for all using ((select is_admin()));

-- PRODUCT IMAGES (public read, admin write)
create policy "Anyone can view product images"
  on product_images for select using (true);
create policy "Admins can manage product images"
  on product_images for all using ((select is_admin()));

-- REVIEWS
create policy "Anyone can view approved reviews"
  on reviews for select using (status = 'approved' or (select auth.uid()) = user_id or (select is_admin()));
create policy "Users can create reviews"
  on reviews for insert with check ((select auth.uid()) = user_id);
create policy "Users can update own reviews"
  on reviews for update using ((select auth.uid()) = user_id or (select is_admin()));
create policy "Admins can manage reviews"
  on reviews for all using ((select is_admin()));

-- INQUIRIES
create policy "Users can view own inquiries"
  on inquiries for select using ((select auth.uid()) = user_id or (select is_admin()));
create policy "Users can create inquiries"
  on inquiries for insert with check ((select auth.uid()) = user_id);
create policy "Admins can manage inquiries"
  on inquiries for all using ((select is_admin()));

-- WISHLISTS
create policy "Users can manage own wishlist"
  on wishlists for all using ((select auth.uid()) = user_id);

-- CONTACT MESSAGES
create policy "Anyone can create messages"
  on contact_messages for insert with check (true);
create policy "Admins can view messages"
  on contact_messages for select using ((select is_admin()));
create policy "Admins can update messages"
  on contact_messages for update using ((select is_admin()));

-- ============================================================
-- INDEXES for performance
-- ============================================================

-- Single-column indexes on slugs and FK columns
create index idx_categories_slug on categories(slug);
create index idx_products_slug on products(slug);
create index idx_products_category on products(category_id);
create index idx_products_featured on products(is_featured) where is_featured = true;
create index idx_product_images_product on product_images(product_id);
create index idx_reviews_product on reviews(product_id);
create index idx_reviews_user on reviews(user_id);
create index idx_inquiries_user on inquiries(user_id);
create index idx_inquiries_product on inquiries(product_id);
create index idx_wishlists_user on wishlists(user_id);
create index idx_wishlists_product on wishlists(product_id);

-- Composite indexes for common query patterns
create index idx_products_status_category on products(status, category_id);
create index idx_products_status_price on products(status, price);
create index idx_products_status_created on products(status, created_at desc);
create index idx_reviews_product_status on reviews(product_id, status);

-- Full-text search: stored generated column + GIN index
alter table products add column search_vector tsvector
  generated always as (
    to_tsvector('english',
      coalesce(title, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(material, '') || ' ' ||
      coalesce(occasion, '') || ' ' ||
      coalesce(work_type, '')
    )
  ) stored;

create index idx_products_search on products using gin(search_vector);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-update timestamps
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on profiles for each row execute function update_updated_at();
create trigger set_updated_at before update on categories for each row execute function update_updated_at();
create trigger set_updated_at before update on products for each row execute function update_updated_at();
create trigger set_updated_at before update on reviews for each row execute function update_updated_at();
create trigger set_updated_at before update on inquiries for each row execute function update_updated_at();

-- Recalculate product rating on review changes (optimized: single scan, skip no-ops)
create or replace function update_product_rating()
returns trigger as $$
declare
  target_product_id uuid;
begin
  if tg_op = 'UPDATE'
    and old.status = new.status
    and old.rating = new.rating
    and old.product_id = new.product_id then
    return new;
  end if;

  target_product_id := coalesce(new.product_id, old.product_id);

  update products set
    (avg_rating, review_count) = (
      select coalesce(round(avg(rating)::numeric, 1), 0),
             count(*)
      from reviews
      where product_id = target_product_id and status = 'approved'
    )
  where id = target_product_id;

  return coalesce(new, old);
end;
$$ language plpgsql security definer set search_path = '';

create trigger on_review_change
  after insert or update or delete on reviews
  for each row execute function update_product_rating();
