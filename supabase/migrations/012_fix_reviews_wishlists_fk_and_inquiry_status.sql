-- reviews.user_id and wishlists.user_id still pointed at auth.users — the same
-- drift that 010_fix_inquiries_profiles_fk.sql fixed for inquiries. PostgREST can
-- only auto-detect direct foreign keys, so the `profiles(...)` embeds in
-- getAdminReviews()/getProductReviews() errored out silently: the admin
-- moderation queue always showed "No reviews yet" and approved reviews never
-- rendered on product pages.
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;
ALTER TABLE reviews ADD CONSTRAINT reviews_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE wishlists DROP CONSTRAINT IF EXISTS wishlists_user_id_fkey;
ALTER TABLE wishlists ADD CONSTRAINT wishlists_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- One review per user per product. The app already maps unique-violation (23505)
-- to an "already reviewed" message, but the constraint itself never existed, so
-- duplicate reviews were silently possible.
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_user_product_unique;
ALTER TABLE reviews ADD CONSTRAINT reviews_user_product_unique
  UNIQUE (user_id, product_id);

-- Inquiries now start as 'initiated' (customer began a WhatsApp order) instead of
-- 'sent': the client cannot verify the WhatsApp tab actually opened (popup
-- blockers), so 'sent' overstated what happened. 'sent' remains valid for
-- existing rows and manual use.
ALTER TABLE inquiries DROP CONSTRAINT IF EXISTS inquiries_status_check;
ALTER TABLE inquiries ADD CONSTRAINT inquiries_status_check
  CHECK (status = ANY (ARRAY['initiated'::text, 'sent'::text, 'responded'::text, 'completed'::text, 'cancelled'::text]));
ALTER TABLE inquiries ALTER COLUMN status SET DEFAULT 'initiated';

NOTIFY pgrst, 'reload schema';
