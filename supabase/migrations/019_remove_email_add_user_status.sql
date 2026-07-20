-- Drop email/OTP verification entirely — login is username+password only,
-- and the store holds no sensitive user data that would need it.
ALTER TABLE profiles DROP COLUMN IF EXISTS email_verified;
ALTER TABLE profiles DROP COLUMN IF EXISTS email;

-- handle_new_user() no longer sources email/real_email from signup metadata.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Soft-delete flag for the admin Users page ("Remove user" = deactivate,
-- reversible — blocks login without touching their order/review history).
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
