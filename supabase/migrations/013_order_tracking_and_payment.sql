-- Reseller trust features: order tracking + payment preference.
--
-- The store is run by a reseller who closes orders over WhatsApp with
-- 7-10 day delivery and a strict no-return policy. Two new lifecycle stages
-- ('shipped', 'delivered') let the admin keep customers informed from the
-- inquiry screen instead of answering "where is my order?" chats, and the
-- customer's chosen payment method (online vs COD +150) is recorded with the
-- inquiry so the conversation starts with terms already agreed.
ALTER TABLE inquiries DROP CONSTRAINT IF EXISTS inquiries_status_check;
ALTER TABLE inquiries ADD CONSTRAINT inquiries_status_check
  CHECK (status = ANY (ARRAY[
    'initiated'::text,
    'sent'::text,
    'responded'::text,
    'shipped'::text,
    'delivered'::text,
    'completed'::text,
    'cancelled'::text
  ]));

ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS payment_method text
  CHECK (payment_method IN ('online', 'cod'));
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS tracking_courier text;
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS tracking_number text;
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS shipped_at timestamptz;
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS delivered_at timestamptz;

NOTIFY pgrst, 'reload schema';
