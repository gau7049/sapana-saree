-- 006's replacement of handle_new_user() dropped the public. schema
-- qualification that the original had. Since the function sets
-- search_path = '' (hardening), an unqualified "profiles" fails to resolve
-- at all, causing every signup to fail with "Database error saving new
-- user". Restore qualification.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, full_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'real_email',
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
