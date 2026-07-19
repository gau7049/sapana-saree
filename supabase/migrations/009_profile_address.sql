-- Single saved address per account. profiles.phone is reused as the
-- address contact number (moved out of the general Profile/Settings form
-- into the Address form) — no new phone column needed.
ALTER TABLE profiles
  ADD COLUMN address_line1 TEXT,
  ADD COLUMN address_line2 TEXT,
  ADD COLUMN city TEXT,
  ADD COLUMN state TEXT,
  ADD COLUMN country TEXT,
  ADD COLUMN postal_code TEXT;
