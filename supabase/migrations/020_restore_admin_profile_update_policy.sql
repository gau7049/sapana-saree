-- "Admins can update all profiles" (from 004_performance_optimizations.sql) is
-- missing from the live database — admin UPDATEs on other users' profiles
-- (e.g. the Users page deactivate/reactivate toggle) silently affect 0 rows
-- instead of erroring, since RLS just filters them out. Restore it, with a
-- WITH CHECK clause this time (004's version only had USING), matching the
-- hardening approach from 017_security_hardening.sql.
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING ((select is_admin()))
  WITH CHECK ((select is_admin()));
