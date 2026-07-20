-- Security hardening: two RLS policies from 004_performance_optimizations.sql
-- carried a USING clause but no WITH CHECK. Postgres reuses USING for the
-- check when WITH CHECK is omitted, which only re-validates row OWNERSHIP —
-- it never constrains what the new row values can be. Both holes are
-- reachable directly via the public anon key + a user's own session (no app
-- code involved), since the app's server actions never triggered them.

-- 1) profiles: a user updating their own row could set role = 'admin' (or
--    'super_admin'), self-escalating privileges — ADMIN_ROLES membership is
--    the only thing requireAdmin()/RLS admin policies check.
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING ((select auth.uid()) = id)
  WITH CHECK (
    (select auth.uid()) = id
    AND role = (SELECT role FROM profiles WHERE id = (select auth.uid()))
  );

-- 2) reviews: a user updating their own pending review could set
--    status = 'approved' directly, bypassing admin moderation entirely (the
--    review would then display store-wide as approved).
DROP POLICY IF EXISTS "Users can update own pending reviews" ON reviews;
CREATE POLICY "Users can update own pending reviews"
  ON reviews FOR UPDATE
  USING ((select auth.uid()) = user_id AND status = 'pending')
  WITH CHECK ((select auth.uid()) = user_id AND status = 'pending');
