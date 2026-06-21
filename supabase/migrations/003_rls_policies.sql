-- ============================================
-- HELPER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================
-- PROFILES
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT USING (is_admin());

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE USING (is_admin());

-- ============================================
-- CATEGORIES
-- ============================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active categories"
  ON categories FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage categories"
  ON categories FOR ALL USING (is_admin());

-- ============================================
-- PRODUCTS
-- ============================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published products"
  ON products FOR SELECT USING (status = 'published');

CREATE POLICY "Admins can manage products"
  ON products FOR ALL USING (is_admin());

-- ============================================
-- PRODUCT IMAGES
-- ============================================
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view product images"
  ON product_images FOR SELECT USING (true);

CREATE POLICY "Admins can manage images"
  ON product_images FOR ALL USING (is_admin());

-- ============================================
-- REVIEWS
-- ============================================
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved reviews"
  ON reviews FOR SELECT USING (status = 'approved');

CREATE POLICY "Users can view own reviews"
  ON reviews FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create reviews"
  ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending reviews"
  ON reviews FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can manage reviews"
  ON reviews FOR ALL USING (is_admin());

-- ============================================
-- INQUIRIES
-- ============================================
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own inquiries"
  ON inquiries FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create inquiries"
  ON inquiries FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage inquiries"
  ON inquiries FOR ALL USING (is_admin());

-- ============================================
-- WISHLISTS
-- ============================================
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own wishlists"
  ON wishlists FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- CONTACT MESSAGES
-- ============================================
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create messages"
  ON contact_messages FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage messages"
  ON contact_messages FOR ALL USING (is_admin());

-- ============================================
-- SITE SETTINGS
-- ============================================
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read settings"
  ON site_settings FOR SELECT USING (true);

CREATE POLICY "Admins can manage settings"
  ON site_settings FOR ALL USING (is_admin());
