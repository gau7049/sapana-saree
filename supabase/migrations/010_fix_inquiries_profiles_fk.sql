-- inquiries.user_id was pointing at auth.users instead of profiles (a drift from
-- 001_initial_schema.sql's documented intent), which silently breaks PostgREST's
-- ability to embed `profiles(...)` in inquiry queries (getAdminInquiries()) since
-- it can only auto-detect direct foreign keys, not the transitive
-- profiles.id -> auth.users.id relationship.
ALTER TABLE inquiries DROP CONSTRAINT inquiries_user_id_fkey;
ALTER TABLE inquiries ADD CONSTRAINT inquiries_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

NOTIFY pgrst, 'reload schema';
