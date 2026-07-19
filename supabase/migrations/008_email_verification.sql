-- Track whether a profile's recovery email has been confirmed via magic link.
-- Existing emails (set before this feature existed) are grandfathered as verified
-- so current users don't lose password-recovery access.
ALTER TABLE profiles ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT false;
UPDATE profiles SET email_verified = true WHERE email IS NOT NULL;
