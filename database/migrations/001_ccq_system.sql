-- ============================================================================
-- DAST Solutions - Système CCQ/ACQ
-- Migration 001: Tables principales pour taux horaires et cotisations CCQ
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE: ccq_sectors - Secteurs de construction
-- ============================================================================
CREATE TABLE IF NOT EXISTS ccq_sectors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  name_fr TEXT NOT NULL,
  name_en TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_ccq_sectors_code ON ccq_sectors(code);
CREATE INDEX idx_ccq_sectors_active ON ccq_sectors(is_active);

-- ============================================================================
-- TABLE: ccq_trades - Métiers et occupations
-- ============================================================================
CREATE TABLE IF NOT EXISTS ccq_trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  name_fr TEXT NOT NULL,
  name_en TEXT,
  category TEXT NOT NULL CHECK (category IN ('metier', 'occupation')),
  description TEXT,
  requires_license BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_ccq_trades_code ON ccq_trades(code);
CREATE INDEX idx_ccq_trades_category ON ccq_trades(category);
CREATE INDEX idx_ccq_trades_active ON ccq_trades(is_active);

-- ============================================================================
-- TABLE: ccq_regions - Régions du Québec
-- ============================================================================
CREATE TABLE IF NOT EXISTS ccq_regions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  name_fr TEXT NOT NULL,
  name_en TEXT,
  zone_number INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_ccq_regions_code ON ccq_regions(code);

-- ============================================================================
-- TABLE: ccq_hourly_rates - Taux horaires
-- ============================================================================
CREATE TABLE IF NOT EXISTS ccq_hourly_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trade_id UUID NOT NULL REFERENCES ccq_trades(id),
  sector_id UUID NOT NULL REFERENCES ccq_sectors(id),
  region_id UUID REFERENCES ccq_regions(id),
  
  -- Dates de validité
  effective_date DATE NOT NULL,
  expiry_date DATE,
  
  -- Taux réguliers
  base_rate DECIMAL(10,2) NOT NULL,
  rate_time_half DECIMAL(10,2),
  rate_double_time DECIMAL(10,2),
  
  -- Taux de soir (19h-7h)
  evening_base_rate DECIMAL(10,2),
  evening_rate_time_half DECIMAL(10,2),
  evening_rate_double_time DECIMAL(10,2),
  
  -- Métadonnées
  source_document TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contraintes
  CONSTRAINT valid_date_range CHECK (expiry_date IS NULL OR expiry_date > effective_date),
  CONSTRAINT positive_rates CHECK (base_rate > 0)
);

-- Index
CREATE INDEX idx_ccq_rates_trade ON ccq_hourly_rates(trade_id);
CREATE INDEX idx_ccq_rates_sector ON ccq_hourly_rates(sector_id);
CREATE INDEX idx_ccq_rates_dates ON ccq_hourly_rates(effective_date, expiry_date);
CREATE INDEX idx_ccq_rates_active ON ccq_hourly_rates(is_active);

-- ============================================================================
-- TABLE: ccq_social_benefits - Cotisations avantages sociaux
-- ============================================================================
CREATE TABLE IF NOT EXISTS ccq_social_benefits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trade_id UUID NOT NULL REFERENCES ccq_trades(id),
  sector_id UUID NOT NULL REFERENCES ccq_sectors(id),
  
  effective_date DATE NOT NULL,
  expiry_date DATE,
  
  -- Cotisations employé (en % du salaire)
  health_insurance_rate DECIMAL(5,3),
  pension_plan_rate DECIMAL(5,3),
  training_fund_rate DECIMAL(5,3),
  vacation_fund_rate DECIMAL(5,3) DEFAULT 13.0,
  statutory_holidays_rate DECIMAL(5,3) DEFAULT 5.5,
  
  -- Cotisations patronales
  employer_health_rate DECIMAL(5,3),
  employer_pension_rate DECIMAL(5,3),
  employer_training_rate DECIMAL(5,3),
  
  source_document TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_ccq_benefits_trade ON ccq_social_benefits(trade_id);
CREATE INDEX idx_ccq_benefits_sector ON ccq_social_benefits(sector_id);
CREATE INDEX idx_ccq_benefits_dates ON ccq_social_benefits(effective_date, expiry_date);

-- ============================================================================
-- VIEW: v_ccq_current_rates - Taux actuellement en vigueur
-- ============================================================================
CREATE OR REPLACE VIEW v_ccq_current_rates AS
SELECT 
  r.id,
  t.code as trade_code,
  t.name_fr as trade_name,
  s.code as sector_code,
  s.name_fr as sector_name,
  reg.code as region_code,
  r.base_rate,
  COALESCE(r.rate_time_half, r.base_rate * 1.5) as rate_time_half,
  COALESCE(r.rate_double_time, r.base_rate * 2.0) as rate_double_time,
  r.evening_base_rate,
  r.evening_rate_time_half,
  r.evening_rate_double_time,
  b.vacation_fund_rate,
  b.statutory_holidays_rate,
  r.effective_date,
  r.expiry_date
FROM ccq_hourly_rates r
JOIN ccq_trades t ON r.trade_id = t.id
JOIN ccq_sectors s ON r.sector_id = s.id
LEFT JOIN ccq_regions reg ON r.region_id = reg.id
LEFT JOIN ccq_social_benefits b ON b.trade_id = t.id AND b.sector_id = s.id 
  AND b.effective_date <= CURRENT_DATE 
  AND (b.expiry_date IS NULL OR b.expiry_date >= CURRENT_DATE)
WHERE r.is_active = true
  AND r.effective_date <= CURRENT_DATE
  AND (r.expiry_date IS NULL OR r.expiry_date >= CURRENT_DATE)
  AND t.is_active = true
  AND s.is_active = true;

-- ============================================================================
-- FUNCTION: calculate_total_employee_cost - Calcul coût total employé
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_total_employee_cost(
  p_trade_code TEXT,
  p_sector_code TEXT,
  p_hours_worked NUMERIC,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSON AS $$
DECLARE
  v_rate RECORD;
  v_benefits RECORD;
  v_base_salary NUMERIC;
  v_vacation NUMERIC;
  v_holidays NUMERIC;
  v_health NUMERIC;
  v_pension NUMERIC;
  v_training NUMERIC;
  v_social_benefits NUMERIC;
  v_total_cost NUMERIC;
BEGIN
  -- Récupérer le taux horaire
  SELECT base_rate INTO v_rate
  FROM v_ccq_current_rates
  WHERE trade_code = p_trade_code
    AND sector_code = p_sector_code
  LIMIT 1;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Taux non trouvé pour métier % et secteur %', p_trade_code, p_sector_code;
  END IF;
  
  -- Calculer le salaire de base
  v_base_salary := p_hours_worked * v_rate.base_rate;
  
  -- Récupérer les cotisations
  SELECT 
    vacation_fund_rate,
    statutory_holidays_rate,
    COALESCE(health_insurance_rate, 0) as health_rate,
    COALESCE(pension_plan_rate, 0) as pension_rate,
    COALESCE(training_fund_rate, 0) as training_rate
  INTO v_benefits
  FROM v_ccq_current_rates
  WHERE trade_code = p_trade_code
    AND sector_code = p_sector_code
  LIMIT 1;
  
  -- Calculer les cotisations
  v_vacation := v_base_salary * (COALESCE(v_benefits.vacation_fund_rate, 13.0) / 100);
  v_holidays := v_base_salary * (COALESCE(v_benefits.statutory_holidays_rate, 5.5) / 100);
  v_health := v_base_salary * (v_benefits.health_rate / 100);
  v_pension := v_base_salary * (v_benefits.pension_rate / 100);
  v_training := v_base_salary * (v_benefits.training_rate / 100);
  
  v_social_benefits := v_vacation + v_holidays + v_health + v_pension + v_training;
  v_total_cost := v_base_salary + v_social_benefits;
  
  -- Retourner le résultat en JSON
  RETURN json_build_object(
    'base_salary', v_base_salary,
    'vacation', v_vacation,
    'statutory_holidays', v_holidays,
    'health_insurance', v_health,
    'pension', v_pension,
    'training_fund', v_training,
    'social_benefits', v_social_benefits,
    'total_cost', v_total_cost,
    'hours_worked', p_hours_worked,
    'hourly_rate', v_rate.base_rate,
    'effective_date', p_date
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SEED DATA: Secteurs de base
-- ============================================================================
INSERT INTO ccq_sectors (code, name_fr, description) VALUES
  ('ICI', 'Institutionnel/Commercial/Industriel', 'Secteur ICI standard'),
  ('BAIE_JAMES', 'Baie-James', 'Secteur Baie-James et Grand Nord'),
  ('IND_LOURD', 'Industrie lourde', 'Secteur industrie lourde'),
  ('RES_LEGER', 'Résidentiel léger', 'Résidentiel 1-5 logements'),
  ('RES_LOURD', 'Résidentiel lourd', 'Résidentiel 6+ logements')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- SEED DATA: Métiers courants
-- ============================================================================
INSERT INTO ccq_trades (code, name_fr, category, requires_license) VALUES
  ('CARP', 'Charpentier-menuisier', 'metier', true),
  ('ELEC', 'Électricien', 'metier', true),
  ('PLMB', 'Plombier', 'metier', true),
  ('BRIQ', 'Briqueteur-maçon', 'metier', true),
  ('PEIN', 'Peintre', 'metier', true),
  ('FRIG', 'Frigoriste', 'metier', true),
  ('TUYA', 'Tuyauteur', 'metier', true),
  ('FERB', 'Ferblantier', 'metier', true),
  ('COUV', 'Couvreur', 'metier', true),
  ('PLAT', 'Plâtrier', 'metier', true)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- TRIGGERS: Updated_at automatique
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ccq_sectors_updated_at BEFORE UPDATE ON ccq_sectors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ccq_trades_updated_at BEFORE UPDATE ON ccq_trades
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ccq_hourly_rates_updated_at BEFORE UPDATE ON ccq_hourly_rates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ccq_social_benefits_updated_at BEFORE UPDATE ON ccq_social_benefits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE ccq_sectors IS 'Secteurs de construction CCQ';
COMMENT ON TABLE ccq_trades IS 'Métiers et occupations CCQ';
COMMENT ON TABLE ccq_hourly_rates IS 'Taux horaires par métier/secteur/région';
COMMENT ON TABLE ccq_social_benefits IS 'Cotisations avantages sociaux';
COMMENT ON VIEW v_ccq_current_rates IS 'Vue des taux actuellement en vigueur';
COMMENT ON FUNCTION calculate_total_employee_cost IS 'Calcule le coût total d''un employé incluant toutes les cotisations';
