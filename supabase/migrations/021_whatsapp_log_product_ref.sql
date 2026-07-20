-- Admin couldn't tell which product a WhatsApp log entry was about — only
-- the customer and a generic first line of the message were shown. Add a
-- product reference so the admin Messages page can show the product name
-- and link it, same as the Inquiries page already does via inquiries.product_id.
ALTER TABLE whatsapp_logs
  ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES products(id) ON DELETE SET NULL;

NOTIFY pgrst, 'reload schema';
