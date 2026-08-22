-- Verified Providers & Reviews module
-- Created: 2026-08-22

-- ============================================================
-- 1. VERIFIED PROVIDERS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS verified_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,

  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN (
    'plumber', 'electrician', 'painter', 'carpenter',
    'appliance_repair', 'locksmith', 'cleaning', 'gardening', 'other'
  )),
  phone VARCHAR(20) NOT NULL,
  whatsapp VARCHAR(20),
  email VARCHAR(100),
  description TEXT,

  verified_by VARCHAR(100),
  is_verified BOOLEAN DEFAULT true,

  avg_rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. PROVIDER REVIEWS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS provider_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES verified_providers(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL,
  reviewer_name VARCHAR(100) NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_providers_building ON verified_providers(building_id);
CREATE INDEX IF NOT EXISTS idx_providers_category ON verified_providers(category);
CREATE INDEX IF NOT EXISTS idx_provider_reviews_provider ON provider_reviews(provider_id);

-- ============================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE verified_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_reviews ENABLE ROW LEVEL SECURITY;

-- Providers: users in building can read
CREATE POLICY "providers_select_building" ON verified_providers FOR SELECT USING (
  building_id IN (SELECT building_id FROM users WHERE id::text = auth.uid()::text)
);

-- Providers: admin can insert
CREATE POLICY "providers_insert_admin" ON verified_providers FOR INSERT WITH CHECK (
  building_id IN (SELECT building_id FROM users WHERE id::text = auth.uid()::text AND role IN ('admin', 'super_admin'))
);

-- Reviews: users in building can read
CREATE POLICY "provider_reviews_select" ON provider_reviews FOR SELECT USING (
  provider_id IN (SELECT id FROM verified_providers WHERE building_id IN (SELECT building_id FROM users WHERE id::text = auth.uid()::text))
);

-- Reviews: any user can insert as themselves
CREATE POLICY "provider_reviews_insert" ON provider_reviews FOR INSERT WITH CHECK (
  reviewer_id::text = auth.uid()::text
);

-- ============================================================
-- 5. UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_providers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS providers_updated_at_trigger ON verified_providers;
CREATE TRIGGER providers_updated_at_trigger
  BEFORE UPDATE ON verified_providers
  FOR EACH ROW
  EXECUTE FUNCTION update_providers_updated_at();
