-- ============================================
-- PRODUCT AVAILABILITY
-- ============================================
-- Boolean in-stock / sold-out flag. This store has no cart/checkout or
-- quantity decrement flow (orders happen via WhatsApp inquiry), so a
-- boolean flag matches the actual business model instead of a quantity
-- counter.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true NOT NULL;
