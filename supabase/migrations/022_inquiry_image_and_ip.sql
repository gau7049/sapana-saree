-- Two admin asks:
-- 1. A product listing can bundle several sarees under one page (multiple
--    product_images) — admin needs to know exactly which one the customer
--    picked, not just the product. Record the specific image on both the
--    inquiry and the WhatsApp log (mirrors the product_id ref added in 021).
-- 2. Basic audit trail: the IP the order was placed from, so admin can spot
--    a delivery address that doesn't plausibly match where the order came
--    from (e.g. via a manual IP lookup) without adding a paid geolocation
--    dependency.
ALTER TABLE inquiries
  ADD COLUMN IF NOT EXISTS product_image_id uuid REFERENCES product_images(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS ip_address text;

ALTER TABLE whatsapp_logs
  ADD COLUMN IF NOT EXISTS product_image_id uuid REFERENCES product_images(id) ON DELETE SET NULL;

NOTIFY pgrst, 'reload schema';
