-- Site-wide content settings (currently just the homepage hero image), so
-- the client can replace it from Admin > Settings instead of it being a
-- hardcoded placeholder in the component.
--
-- Single-row table, same pattern as loyalty_settings: public SELECT (the
-- homepage needs it), writes go through the service role (admin action).

CREATE TABLE IF NOT EXISTS site_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  hero_image_url text,
  hero_image_public_id text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO site_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read site settings" ON site_settings;
CREATE POLICY "Anyone can read site settings" ON site_settings
  FOR SELECT USING (true);

NOTIFY pgrst, 'reload schema';
