-- Loyalty points, referrals, product-launch email guard, and WhatsApp audit log.
--
-- Design notes:
-- * loyalty_transactions is an append-only ledger; a customer's balance is the
--   SUM of their rows. Earning rows are positive, redemptions/revocations
--   negative — no separate balance column to drift out of sync.
-- * review_rewards remembers that a (user, product) pair has been rewarded so
--   deleting and re-posting a review can never farm points.
-- * Config lives in loyalty_settings (single row) so the admin can tune point
--   values without a deploy.

-- ============ settings ============
CREATE TABLE IF NOT EXISTS loyalty_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  welcome_points int NOT NULL DEFAULT 10,
  review_points int NOT NULL DEFAULT 2,
  review_min_rating int NOT NULL DEFAULT 3,
  referral_points int NOT NULL DEFAULT 5,
  orders_milestone_count int NOT NULL DEFAULT 3,
  orders_milestone_points int NOT NULL DEFAULT 25,
  point_value_inr numeric NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO loyalty_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ============ ledger ============
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  points int NOT NULL,
  type text NOT NULL CHECK (type IN (
    'welcome', 'review', 'review_revoked', 'referral',
    'orders_milestone', 'redeemed', 'redemption_refund', 'adjustment'
  )),
  reference_id uuid,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_loyalty_tx_user ON loyalty_transactions(user_id, created_at DESC);

-- ============ review reward guard ============
CREATE TABLE IF NOT EXISTS review_rewards (
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  revoked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, product_id)
);

-- ============ referrals ============
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code text UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- Backfill codes for existing users.
UPDATE profiles
SET referral_code = 'SAP' || upper(substring(md5(gen_random_uuid()::text) FROM 1 FOR 6))
WHERE referral_code IS NULL;

CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id uuid NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'rewarded')),
  rewarded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);

-- ============ checkout redemption ============
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS points_redeemed int NOT NULL DEFAULT 0
  CHECK (points_redeemed >= 0);

-- ============ new-product email guard ============
ALTER TABLE products ADD COLUMN IF NOT EXISTS notified_at timestamptz;

-- ============ WhatsApp audit log ============
CREATE TABLE IF NOT EXISTS whatsapp_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  kind text NOT NULL CHECK (kind IN (
    'order', 'inquiry_reopen', 'unboxing', 'share', 'support'
  )),
  message text NOT NULL,
  -- wa.me deep links carry no delivery receipts (that needs the WhatsApp
  -- Business API), so the trackable status is that the link was generated.
  status text NOT NULL DEFAULT 'link_generated',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_created ON whatsapp_logs(created_at DESC);

-- ============ RLS ============
ALTER TABLE loyalty_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_logs ENABLE ROW LEVEL SECURITY;

-- Settings are public (the storefront needs point values for the redeem UI);
-- writes go through the service role only.
DROP POLICY IF EXISTS "Anyone can read loyalty settings" ON loyalty_settings;
CREATE POLICY "Anyone can read loyalty settings" ON loyalty_settings
  FOR SELECT USING (true);

-- Customers see their own ledger; admins see everyone's. All writes go
-- through the service role (server actions) so earning rules can't be forged.
DROP POLICY IF EXISTS "Users read own loyalty transactions" ON loyalty_transactions;
CREATE POLICY "Users read own loyalty transactions" ON loyalty_transactions
  FOR SELECT USING (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "Admins read review rewards" ON review_rewards;
CREATE POLICY "Admins read review rewards" ON review_rewards
  FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "Users read own referrals" ON referrals;
CREATE POLICY "Users read own referrals" ON referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id OR is_admin());

DROP POLICY IF EXISTS "Admins read whatsapp logs" ON whatsapp_logs;
CREATE POLICY "Admins read whatsapp logs" ON whatsapp_logs
  FOR SELECT USING (is_admin());

NOTIFY pgrst, 'reload schema';
