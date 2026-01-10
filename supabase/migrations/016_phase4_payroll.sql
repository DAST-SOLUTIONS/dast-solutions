-- ============================================================
-- DAST Solutions - Phase 4: Paie Standard et CCQ (QIPAIE)
-- Migration SQL pour la gestion de la paie Québec
-- Date: 2026-01-10
-- ============================================================

-- ============================================================
-- 1. TABLE EMPLOYEES_STANDARD (Employés non-CCQ)
-- ============================================================

CREATE TABLE IF NOT EXISTS employees_standard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  employee_number VARCHAR(20) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  hire_date DATE NOT NULL,
  termination_date DATE,
  job_title VARCHAR(100),
  department VARCHAR(100),
  pay_type VARCHAR(20) DEFAULT 'hourly' CHECK (pay_type IN ('hourly', 'salary')),
  hourly_rate DECIMAL(10,2),
  annual_salary DECIMAL(12,2),
  pay_frequency VARCHAR(20) DEFAULT 'biweekly' CHECK (pay_frequency IN ('weekly', 'biweekly', 'semimonthly', 'monthly')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
  sin_last4 VARCHAR(4),
  bank_transit VARCHAR(5),
  bank_institution VARCHAR(3),
  bank_account VARCHAR(12),
  td1_federal_claim DECIMAL(10,2) DEFAULT 0,
  tp1_provincial_claim DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_employees_standard_user ON employees_standard(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_standard_status ON employees_standard(status);
CREATE INDEX IF NOT EXISTS idx_employees_standard_number ON employees_standard(employee_number);

-- RLS
ALTER TABLE employees_standard ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own standard employees" ON employees_standard;
CREATE POLICY "Users can manage own standard employees" ON employees_standard
  FOR ALL USING (user_id = auth.uid());


-- ============================================================
-- 2. TABLE EMPLOYEES_CCQ (Employés CCQ)
-- ============================================================

CREATE TABLE IF NOT EXISTS employees_ccq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  employee_number VARCHAR(20) NOT NULL,
  ccq_number VARCHAR(20) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  hire_date DATE NOT NULL,
  termination_date DATE,
  trade_code VARCHAR(10) NOT NULL,
  classification VARCHAR(20) DEFAULT 'compagnon' CHECK (classification IN ('compagnon', 'apprenti1', 'apprenti2', 'apprenti3', 'apprenti4', 'apprenti5')),
  sector_code VARCHAR(10) DEFAULT 'RL' CHECK (sector_code IN ('RL', 'RH', 'ICI', 'GC')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
  ccq_card_expiry DATE,
  sin_last4 VARCHAR(4),
  bank_transit VARCHAR(5),
  bank_institution VARCHAR(3),
  bank_account VARCHAR(12),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_employees_ccq_user ON employees_ccq(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_ccq_ccq_number ON employees_ccq(ccq_number);
CREATE INDEX IF NOT EXISTS idx_employees_ccq_trade ON employees_ccq(trade_code);
CREATE INDEX IF NOT EXISTS idx_employees_ccq_sector ON employees_ccq(sector_code);

-- RLS
ALTER TABLE employees_ccq ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own ccq employees" ON employees_ccq;
CREATE POLICY "Users can manage own ccq employees" ON employees_ccq
  FOR ALL USING (user_id = auth.uid());


-- ============================================================
-- 3. TABLE PAYROLL_RUNS_STANDARD (Cycles de paie standard)
-- ============================================================

CREATE TABLE IF NOT EXISTS payroll_runs_standard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  pay_period_start DATE NOT NULL,
  pay_period_end DATE NOT NULL,
  pay_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'approved', 'paid')),
  total_gross DECIMAL(12,2) DEFAULT 0,
  total_deductions DECIMAL(12,2) DEFAULT 0,
  total_net DECIMAL(12,2) DEFAULT 0,
  total_employer_cost DECIMAL(12,2) DEFAULT 0,
  entries_count INTEGER DEFAULT 0,
  approved_by VARCHAR(100),
  approved_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_payroll_runs_standard_user ON payroll_runs_standard(user_id);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_standard_date ON payroll_runs_standard(pay_date);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_standard_status ON payroll_runs_standard(status);

-- RLS
ALTER TABLE payroll_runs_standard ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own standard payroll" ON payroll_runs_standard;
CREATE POLICY "Users can manage own standard payroll" ON payroll_runs_standard
  FOR ALL USING (user_id = auth.uid());


-- ============================================================
-- 4. TABLE PAYROLL_ENTRIES_STANDARD (Entrées de paie standard)
-- ============================================================

CREATE TABLE IF NOT EXISTS payroll_entries_standard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_run_id UUID REFERENCES payroll_runs_standard(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees_standard(id),
  regular_hours DECIMAL(6,2) DEFAULT 0,
  overtime_hours DECIMAL(6,2) DEFAULT 0,
  vacation_hours DECIMAL(6,2) DEFAULT 0,
  sick_hours DECIMAL(6,2) DEFAULT 0,
  gross_pay DECIMAL(10,2) DEFAULT 0,
  federal_tax DECIMAL(10,2) DEFAULT 0,
  provincial_tax DECIMAL(10,2) DEFAULT 0,
  qpp_employee DECIMAL(10,2) DEFAULT 0,
  ei_employee DECIMAL(10,2) DEFAULT 0,
  qpip_employee DECIMAL(10,2) DEFAULT 0,
  other_deductions DECIMAL(10,2) DEFAULT 0,
  total_deductions DECIMAL(10,2) DEFAULT 0,
  net_pay DECIMAL(10,2) DEFAULT 0,
  qpp_employer DECIMAL(10,2) DEFAULT 0,
  ei_employer DECIMAL(10,2) DEFAULT 0,
  qpip_employer DECIMAL(10,2) DEFAULT 0,
  fss_employer DECIMAL(10,2) DEFAULT 0,
  cnt_employer DECIMAL(10,2) DEFAULT 0,
  total_employer_cost DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_payroll_entries_standard_run ON payroll_entries_standard(payroll_run_id);
CREATE INDEX IF NOT EXISTS idx_payroll_entries_standard_employee ON payroll_entries_standard(employee_id);

-- RLS
ALTER TABLE payroll_entries_standard ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own standard payroll entries" ON payroll_entries_standard;
CREATE POLICY "Users can manage own standard payroll entries" ON payroll_entries_standard
  FOR ALL USING (
    payroll_run_id IN (SELECT id FROM payroll_runs_standard WHERE user_id = auth.uid())
  );


-- ============================================================
-- 5. TABLE PAYROLL_RUNS_CCQ (Cycles de paie CCQ)
-- ============================================================

CREATE TABLE IF NOT EXISTS payroll_runs_ccq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  pay_period_start DATE NOT NULL,
  pay_period_end DATE NOT NULL,
  pay_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'approved', 'paid')),
  total_gross DECIMAL(12,2) DEFAULT 0,
  total_deductions DECIMAL(12,2) DEFAULT 0,
  total_net DECIMAL(12,2) DEFAULT 0,
  total_employer_cost DECIMAL(12,2) DEFAULT 0,
  total_vacation DECIMAL(12,2) DEFAULT 0,
  total_holidays DECIMAL(12,2) DEFAULT 0,
  total_social_benefits DECIMAL(12,2) DEFAULT 0,
  entries_count INTEGER DEFAULT 0,
  approved_by VARCHAR(100),
  approved_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_payroll_runs_ccq_user ON payroll_runs_ccq(user_id);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_ccq_date ON payroll_runs_ccq(pay_date);

-- RLS
ALTER TABLE payroll_runs_ccq ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own ccq payroll" ON payroll_runs_ccq;
CREATE POLICY "Users can manage own ccq payroll" ON payroll_runs_ccq
  FOR ALL USING (user_id = auth.uid());


-- ============================================================
-- 6. TABLE PAYROLL_ENTRIES_CCQ (Entrées de paie CCQ)
-- ============================================================

CREATE TABLE IF NOT EXISTS payroll_entries_ccq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_run_id UUID REFERENCES payroll_runs_ccq(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees_ccq(id),
  project_id UUID REFERENCES projects(id),
  regular_hours DECIMAL(6,2) DEFAULT 0,
  overtime_hours DECIMAL(6,2) DEFAULT 0,
  double_time_hours DECIMAL(6,2) DEFAULT 0,
  evening_premium BOOLEAN DEFAULT FALSE,
  night_premium BOOLEAN DEFAULT FALSE,
  hourly_rate DECIMAL(10,2) NOT NULL,
  gross_pay DECIMAL(10,2) DEFAULT 0,
  regular_pay DECIMAL(10,2) DEFAULT 0,
  overtime_pay DECIMAL(10,2) DEFAULT 0,
  double_time_pay DECIMAL(10,2) DEFAULT 0,
  premiums DECIMAL(10,2) DEFAULT 0,
  vacation_pay DECIMAL(10,2) DEFAULT 0,
  holiday_pay DECIMAL(10,2) DEFAULT 0,
  social_benefits DECIMAL(10,2) DEFAULT 0,
  rrq_employee DECIMAL(10,2) DEFAULT 0,
  ei_employee DECIMAL(10,2) DEFAULT 0,
  qpip_employee DECIMAL(10,2) DEFAULT 0,
  ccq_levy_employee DECIMAL(10,2) DEFAULT 0,
  total_deductions DECIMAL(10,2) DEFAULT 0,
  net_pay DECIMAL(10,2) DEFAULT 0,
  rrq_employer DECIMAL(10,2) DEFAULT 0,
  ei_employer DECIMAL(10,2) DEFAULT 0,
  qpip_employer DECIMAL(10,2) DEFAULT 0,
  fss_employer DECIMAL(10,2) DEFAULT 0,
  cnesst_employer DECIMAL(10,2) DEFAULT 0,
  ccq_levy_employer DECIMAL(10,2) DEFAULT 0,
  aecq_employer DECIMAL(10,2) DEFAULT 0,
  training_fund DECIMAL(10,2) DEFAULT 0,
  safety_equipment DECIMAL(10,2) DEFAULT 0,
  insurance_tax DECIMAL(10,2) DEFAULT 0,
  total_employer_cost DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_payroll_entries_ccq_run ON payroll_entries_ccq(payroll_run_id);
CREATE INDEX IF NOT EXISTS idx_payroll_entries_ccq_employee ON payroll_entries_ccq(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_entries_ccq_project ON payroll_entries_ccq(project_id);

-- RLS
ALTER TABLE payroll_entries_ccq ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own ccq payroll entries" ON payroll_entries_ccq;
CREATE POLICY "Users can manage own ccq payroll entries" ON payroll_entries_ccq
  FOR ALL USING (
    payroll_run_id IN (SELECT id FROM payroll_runs_ccq WHERE user_id = auth.uid())
  );


-- ============================================================
-- 7. TABLE CCQ_TRADES (Métiers CCQ - Référence)
-- ============================================================

CREATE TABLE IF NOT EXISTS ccq_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  name_en VARCHAR(100),
  apprentice_periods INTEGER DEFAULT 3,
  social_benefits_rate DECIMAL(6,3) DEFAULT 7.020,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insérer les métiers CCQ
INSERT INTO ccq_trades (code, name, apprentice_periods, social_benefits_rate) VALUES
  ('BRQ', 'Briqueteur-maçon', 3, 7.020),
  ('CHP', 'Charpentier-menuisier', 3, 7.020),
  ('ELC', 'Électricien', 5, 8.320),
  ('PLB', 'Plombier', 5, 7.890),
  ('TYT', 'Tuyauteur', 5, 7.890),
  ('FRB', 'Ferblantier', 4, 7.890),
  ('CVR', 'Couvreur', 3, 7.020),
  ('PLT', 'Plâtrier', 3, 7.020),
  ('PNT', 'Peintre', 3, 7.020),
  ('CIM', 'Cimentier-applicateur', 3, 7.020),
  ('FFA', 'Ferrailleur', 3, 7.020),
  ('GRT', 'Grutier classe A', 1, 7.020),
  ('MNV', 'Manoeuvre', 0, 7.020),
  ('OPS', 'Opérateur de pelles', 3, 7.020),
  ('CFR', 'Coffreur', 3, 7.020),
  ('POS', 'Poseur systèmes intérieurs', 3, 7.020),
  ('CRR', 'Carreleur', 3, 7.020),
  ('VTR', 'Vitrier', 3, 7.020),
  ('SCH', 'Soudeur classe A', 3, 7.020),
  ('MCA', 'Mécanicien ascenseurs', 5, 8.320)
ON CONFLICT (code) DO NOTHING;


-- ============================================================
-- 8. TABLE CCQ_RATES (Taux CCQ par métier/secteur)
-- ============================================================

CREATE TABLE IF NOT EXISTS ccq_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_code VARCHAR(10) NOT NULL,
  sector_code VARCHAR(10) NOT NULL CHECK (sector_code IN ('RL', 'RH', 'ICI', 'GC')),
  classification VARCHAR(20) NOT NULL,
  hourly_rate DECIMAL(10,2) NOT NULL,
  effective_date DATE NOT NULL,
  expiry_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trade_code, sector_code, classification, effective_date)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_ccq_rates_trade ON ccq_rates(trade_code);
CREATE INDEX IF NOT EXISTS idx_ccq_rates_sector ON ccq_rates(sector_code);
CREATE INDEX IF NOT EXISTS idx_ccq_rates_date ON ccq_rates(effective_date);

-- Insérer quelques taux 2025 (exemples)
INSERT INTO ccq_rates (trade_code, sector_code, classification, hourly_rate, effective_date) VALUES
  -- Briqueteur-maçon
  ('BRQ', 'RL', 'compagnon', 44.16, '2025-01-01'),
  ('BRQ', 'RL', 'apprenti1', 22.08, '2025-01-01'),
  ('BRQ', 'RL', 'apprenti2', 28.70, '2025-01-01'),
  ('BRQ', 'RL', 'apprenti3', 35.33, '2025-01-01'),
  ('BRQ', 'RH', 'compagnon', 46.87, '2025-01-01'),
  ('BRQ', 'ICI', 'compagnon', 48.52, '2025-01-01'),
  -- Électricien
  ('ELC', 'RL', 'compagnon', 45.36, '2025-01-01'),
  ('ELC', 'RH', 'compagnon', 47.81, '2025-01-01'),
  ('ELC', 'ICI', 'compagnon', 49.43, '2025-01-01'),
  -- Charpentier
  ('CHP', 'RL', 'compagnon', 43.37, '2025-01-01'),
  ('CHP', 'RH', 'compagnon', 47.25, '2025-01-01'),
  ('CHP', 'ICI', 'compagnon', 48.52, '2025-01-01')
ON CONFLICT DO NOTHING;


-- ============================================================
-- 9. TRIGGERS
-- ============================================================

DROP TRIGGER IF EXISTS update_employees_standard_updated_at ON employees_standard;
CREATE TRIGGER update_employees_standard_updated_at
  BEFORE UPDATE ON employees_standard
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_employees_ccq_updated_at ON employees_ccq;
CREATE TRIGGER update_employees_ccq_updated_at
  BEFORE UPDATE ON employees_ccq
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payroll_runs_standard_updated_at ON payroll_runs_standard;
CREATE TRIGGER update_payroll_runs_standard_updated_at
  BEFORE UPDATE ON payroll_runs_standard
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payroll_runs_ccq_updated_at ON payroll_runs_ccq;
CREATE TRIGGER update_payroll_runs_ccq_updated_at
  BEFORE UPDATE ON payroll_runs_ccq
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- 10. VUES
-- ============================================================

-- Vue employés CCQ avec taux actuels
CREATE OR REPLACE VIEW v_employees_ccq_with_rates AS
SELECT 
  e.*,
  t.name as trade_name,
  t.social_benefits_rate,
  r.hourly_rate as current_rate
FROM employees_ccq e
LEFT JOIN ccq_trades t ON e.trade_code = t.code
LEFT JOIN ccq_rates r ON e.trade_code = r.trade_code 
  AND e.sector_code = r.sector_code 
  AND e.classification = r.classification
  AND r.effective_date <= CURRENT_DATE
  AND (r.expiry_date IS NULL OR r.expiry_date > CURRENT_DATE);


-- ============================================================
-- FIN DE LA MIGRATION PHASE 4
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration Phase 4 (Paie) complétée avec succès!';
  RAISE NOTICE '   - Table employees_standard créée';
  RAISE NOTICE '   - Table employees_ccq créée';
  RAISE NOTICE '   - Table payroll_runs_standard créée';
  RAISE NOTICE '   - Table payroll_entries_standard créée';
  RAISE NOTICE '   - Table payroll_runs_ccq créée';
  RAISE NOTICE '   - Table payroll_entries_ccq créée';
  RAISE NOTICE '   - Table ccq_trades créée (20 métiers)';
  RAISE NOTICE '   - Table ccq_rates créée';
  RAISE NOTICE '   - Triggers et vues configurés';
END $$;
