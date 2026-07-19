-- Switches the login identifier from email to username. Email becomes an
-- optional, recovery-only field decoupled from the Supabase Auth identity
-- (which is always a synthetic {username}@accounts.sapanasaree.internal
-- address from this point on — see src/lib/username.ts).

ALTER TABLE profiles ALTER COLUMN email DROP NOT NULL;

ALTER TABLE profiles ADD COLUMN username TEXT;

-- One-time backfill for the 2 existing real accounts (reviewed explicitly,
-- not derived algorithmically, since this is real production data).
UPDATE profiles SET username = 'gautampaliwalce' WHERE email = 'gautampaliwal.ce@gmail.com';
UPDATE profiles SET username = 'sapana0' WHERE email = 'sapana0@gmail.com';
-- Throwaway test account from this session's testing; deleted entirely by
-- scripts/migrate-legacy-auth-emails.mjs right after this migration runs.
UPDATE profiles SET username = 'sapanatestadmin_tmp' WHERE email = 'sapana.test.admin@gmail.com';

ALTER TABLE profiles ALTER COLUMN username SET NOT NULL;
ALTER TABLE profiles ADD CONSTRAINT profiles_username_key UNIQUE (username);
CREATE INDEX idx_profiles_username ON profiles(username);

-- handle_new_user() now sources username/email/full_name from signup
-- metadata instead of NEW.email (which is always the synthetic address).
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, email, full_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'real_email',
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
