-- ============================================
-- PERFORMANCE OPTIMIZATIONS
-- Based on Supabase Postgres Best Practices audit
-- ============================================

-- ============================================
-- 1. RLS PERFORMANCE: Wrap auth.uid() in (select ...)
--    Prevents per-row function evaluation (5-10x faster)
-- ============================================

-- Drop all existing policies that use auth.uid()
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

DROP POLICY IF EXISTS "Anyone can view active categories" ON categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;

DROP POLICY IF EXISTS "Anyone can view published products" ON products;
DROP POLICY IF EXISTS "Admins can manage products" ON products;

DROP POLICY IF EXISTS "Anyone can view product images" ON product_images;
DROP POLICY IF EXISTS "Admins can manage images" ON product_images;

DROP POLICY IF EXISTS "Anyone can view approved reviews" ON reviews;
DROP POLICY IF EXISTS "Users can view own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can create reviews" ON reviews;
DROP POLICY IF EXISTS "Users can update own pending reviews" ON reviews;
DROP POLICY IF EXISTS "Admins can manage reviews" ON reviews;

DROP POLICY IF EXISTS "Users can view own inquiries" ON inquiries;
DROP POLICY IF EXISTS "Users can create inquiries" ON inquiries;
DROP POLICY IF EXISTS "Admins can manage inquiries" ON inquiries;

DROP POLICY IF EXISTS "Users can manage own wishlists" ON wishlists;

DROP POLICY IF EXISTS "Anyone can create messages" ON contact_messages;
DROP POLICY IF EXISTS "Admins can manage messages" ON contact_messages;

-- site_settings policies only if table exists
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'site_settings' AND schemaname = 'public') THEN
    DROP POLICY IF EXISTS "Anyone can read settings" ON site_settings;
    DROP POLICY IF EXISTS "Admins can manage settings" ON site_settings;
  END IF;
END $$;

-- ============================================
-- 2. HARDEN is_admin() FUNCTION
--    Add search_path protection against injection
-- ============================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (select auth.uid()) AND role IN ('admin', 'super_admin')
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = '';

-- ============================================
-- 3. RECREATE ALL RLS POLICIES WITH (select auth.uid())
-- ============================================

-- PROFILES
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING ((select auth.uid()) = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING ((select auth.uid()) = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT USING ((select is_admin()));

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE USING ((select is_admin()));

-- CATEGORIES
CREATE POLICY "Anyone can view active categories"
  ON categories FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage categories"
  ON categories FOR ALL USING ((select is_admin()));

-- PRODUCTS
CREATE POLICY "Anyone can view published products"
  ON products FOR SELECT USING (status = 'published');

CREATE POLICY "Admins can manage products"
  ON products FOR ALL USING ((select is_admin()));

-- PRODUCT IMAGES
CREATE POLICY "Anyone can view product images"
  ON product_images FOR SELECT USING (true);

CREATE POLICY "Admins can manage images"
  ON product_images FOR ALL USING ((select is_admin()));

-- REVIEWS
CREATE POLICY "Anyone can view approved reviews"
  ON reviews FOR SELECT USING (status = 'approved');

CREATE POLICY "Users can view own reviews"
  ON reviews FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create reviews"
  ON reviews FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own pending reviews"
  ON reviews FOR UPDATE USING ((select auth.uid()) = user_id AND status = 'pending');

CREATE POLICY "Admins can manage reviews"
  ON reviews FOR ALL USING ((select is_admin()));

-- INQUIRIES
CREATE POLICY "Users can view own inquiries"
  ON inquiries FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create inquiries"
  ON inquiries FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Admins can manage inquiries"
  ON inquiries FOR ALL USING ((select is_admin()));

-- WISHLISTS
CREATE POLICY "Users can manage own wishlists"
  ON wishlists FOR ALL USING ((select auth.uid()) = user_id);

-- CONTACT MESSAGES
CREATE POLICY "Anyone can create messages"
  ON contact_messages FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage messages"
  ON contact_messages FOR ALL USING ((select is_admin()));

-- SITE SETTINGS (only if table exists)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'site_settings' AND schemaname = 'public') THEN
    EXECUTE 'CREATE POLICY "Anyone can read settings" ON site_settings FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY "Admins can manage settings" ON site_settings FOR ALL USING ((select is_admin()))';
  END IF;
END $$;

-- ============================================
-- 4. COMPOSITE INDEXES
--    Replace separate single-column indexes with composites
-- ============================================

-- Products: status + category (storefront listing with category filter)
CREATE INDEX idx_products_status_category ON products(status, category_id);

-- Products: status + price (storefront price filtering)
CREATE INDEX idx_products_status_price ON products(status, price);

-- Products: status + created_at (default sort on storefront)
CREATE INDEX idx_products_status_created ON products(status, created_at DESC);

-- Reviews: product + status (review display and rating calculation)
CREATE INDEX idx_reviews_product_status ON reviews(product_id, status);

-- Drop redundant single-column indexes now covered by composites
DROP INDEX IF EXISTS idx_products_status;
DROP INDEX IF EXISTS idx_reviews_status;

-- ============================================
-- 5. MISSING FOREIGN KEY INDEX
--    wishlists.product_id needs index for CASCADE deletes
-- ============================================

CREATE INDEX idx_wishlists_product ON wishlists(product_id);

-- ============================================
-- 6. OPTIMIZE update_product_rating() TRIGGER
--    Skip unnecessary recalculations, single scan instead of two
-- ============================================

CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
DECLARE
  target_product_id UUID;
BEGIN
  IF TG_OP = 'UPDATE'
    AND OLD.status = NEW.status
    AND OLD.rating = NEW.rating
    AND OLD.product_id = NEW.product_id THEN
    RETURN NEW;
  END IF;

  target_product_id := COALESCE(NEW.product_id, OLD.product_id);

  UPDATE products SET
    (avg_rating, review_count) = (
      SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0),
             COUNT(*)
      FROM reviews
      WHERE product_id = target_product_id AND status = 'approved'
    )
  WHERE id = target_product_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- ============================================
-- 7. ADD STORED GENERATED tsvector COLUMN FOR SEARCH
--    Enables proper full-text search via Supabase .textSearch()
-- ============================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce(title, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(material, '') || ' ' ||
      coalesce(occasion, '') || ' ' ||
      coalesce(work_type, '')
    )
  ) STORED;

-- Replace the old functional GIN index with one on the stored column
DROP INDEX IF EXISTS idx_products_search;
CREATE INDEX idx_products_search ON products USING gin(search_vector);
