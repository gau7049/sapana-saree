-- Category images: admins can upload a photo per category (Cloudinary-backed,
-- public_id tracked so replaced images can be deleted from storage).
-- image_url already existed in the schema but nothing wrote to it until now.

ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_public_id text;

-- Seed the current categories with the stock photos bundled in
-- public/images/categories/ (filenames match slugs) so tiles look real out of
-- the box. Guarded by IS NULL: re-running never clobbers an admin's upload,
-- and these static paths have no public_id — nothing to clean up when an
-- admin replaces one.
UPDATE categories
SET image_url = '/images/categories/' || slug || '.jpg'
WHERE slug IN (
  'darbari-saree', 'royal-georgette-saree', 'chiffon', 'silk-sarees',
  'cotton-sarees', 'designer-sarees', 'bridal-sarees', 'casual-sarees'
)
AND image_url IS NULL;

NOTIFY pgrst, 'reload schema';
