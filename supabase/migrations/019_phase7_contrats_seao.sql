-- ============================================================
-- DAST Solutions - Phase 7: Contrats et SEAO
-- Gestion des contrats et integration appels d offres publics
-- ============================================================

-- ============================================================
-- PARTIE A: CONTRATS
-- ============================================================

-- TABLE 1: CONTRACTS (Contrats clients et sous-traitants)
-- ============================================================

CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  project_id UUID,
  
  contract_number VARCHAR(30) NOT NULL,
  contract_type VARCHAR(20) NOT NULL CHECK (contract_type IN ('client', 'subcontract')),
  
  client_name VARCHAR(200),
  client_contact VARCHAR(200),
  contractor_id UUID,
  contractor_name VARCHAR(200),
  
  title VARCHAR(300) NOT NULL,
  description TEXT,
  scope_of_work TEXT,
  
  original_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  approved_changes DECIMAL(14,2) DEFAULT 0,
  current_amount DECIMAL(14,2) DEFAULT 0,
  billed_to_date DECIMAL(14,2) DEFAULT 0,
  paid_to_date DECIMAL(14,2) DEFAULT 0,
  
  holdback_percent DECIMAL(5,2) DEFAULT 10,
  holdback_amount DECIMAL(14,2) DEFAULT 0,
  holdback_released DECIMAL(14,2) DEFAULT 0,
  
  start_date DATE,
  end_date DATE,
  signed_date DATE,
  
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending_signature', 'active', 'completed', 'terminated', 'suspended')),
  
  template_type VARCHAR(20) DEFAULT 'custom' CHECK (template_type IN ('ccdc2', 'ccdc5a', 'ccdc14', 'acc', 'custom')),
  
  documents TEXT[] DEFAULT '{}',
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contracts_user ON contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_contracts_project ON contracts(project_id);
CREATE INDEX IF NOT EXISTS idx_contracts_type ON contracts(contract_type);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);

ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own contracts" ON contracts;
CREATE POLICY "Users can manage own contracts" ON contracts
  FOR ALL USING (user_id = auth.uid());


-- TABLE 2: CHANGE_ORDERS_CONTRACT (Avenants aux contrats)
-- ============================================================

CREATE TABLE IF NOT EXISTS change_orders_contract (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  
  co_number VARCHAR(20) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  reason VARCHAR(100),
  
  amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  days_extension INTEGER DEFAULT 0,
  
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  
  submitted_date TIMESTAMPTZ,
  approved_date TIMESTAMPTZ,
  approved_by VARCHAR(100),
  
  documents TEXT[] DEFAULT '{}',
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_change_orders_contract ON change_orders_contract(contract_id);
CREATE INDEX IF NOT EXISTS idx_change_orders_status ON change_orders_contract(status);

ALTER TABLE change_orders_contract ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage change orders via contract" ON change_orders_contract;
CREATE POLICY "Users can manage change orders via contract" ON change_orders_contract
  FOR ALL USING (
    contract_id IN (SELECT id FROM contracts WHERE user_id = auth.uid())
  );


-- TABLE 3: HOLDBACK_RELEASES (Liberations de retenues)
-- ============================================================

CREATE TABLE IF NOT EXISTS holdback_releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  
  release_number VARCHAR(20) NOT NULL,
  amount DECIMAL(14,2) NOT NULL,
  release_date DATE NOT NULL,
  reason VARCHAR(200),
  
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'released')),
  
  approved_by VARCHAR(100),
  approved_date TIMESTAMPTZ,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_holdback_releases_contract ON holdback_releases(contract_id);

ALTER TABLE holdback_releases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage holdbacks via contract" ON holdback_releases;
CREATE POLICY "Users can manage holdbacks via contract" ON holdback_releases
  FOR ALL USING (
    contract_id IN (SELECT id FROM contracts WHERE user_id = auth.uid())
  );


-- TABLE 4: CONTRACT_MILESTONES (Jalons de contrat)
-- ============================================================

CREATE TABLE IF NOT EXISTS contract_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  
  name VARCHAR(200) NOT NULL,
  description TEXT,
  
  target_date DATE,
  completed_date DATE,
  
  amount DECIMAL(14,2),
  percent_complete DECIMAL(5,2) DEFAULT 0,
  
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'delayed')),
  
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contract_milestones_contract ON contract_milestones(contract_id);


-- ============================================================
-- PARTIE B: SEAO (Appels d offres publics)
-- ============================================================

-- TABLE 5: SEAO_TENDERS (Appels d offres SEAO)
-- ============================================================

CREATE TABLE IF NOT EXISTS seao_tenders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  seao_number VARCHAR(30) UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  
  organization_name VARCHAR(300) NOT NULL,
  organization_type VARCHAR(30) CHECK (organization_type IN ('municipal', 'provincial', 'federal', 'education', 'health', 'societe_etat')),
  
  tender_type VARCHAR(30) DEFAULT 'construction' CHECK (tender_type IN ('construction', 'services', 'goods', 'professional')),
  category VARCHAR(50),
  subcategory VARCHAR(50),
  unspsc_codes TEXT[],
  
  region VARCHAR(50),
  city VARCHAR(100),
  
  publication_date DATE,
  closing_date DATE,
  opening_date DATE,
  
  estimated_value_min DECIMAL(14,2),
  estimated_value_max DECIMAL(14,2),
  
  documents_url TEXT,
  
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled', 'awarded')),
  
  awarded_to VARCHAR(300),
  awarded_amount DECIMAL(14,2),
  awarded_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seao_tenders_number ON seao_tenders(seao_number);
CREATE INDEX IF NOT EXISTS idx_seao_tenders_status ON seao_tenders(status);
CREATE INDEX IF NOT EXISTS idx_seao_tenders_closing ON seao_tenders(closing_date);
CREATE INDEX IF NOT EXISTS idx_seao_tenders_region ON seao_tenders(region);
CREATE INDEX IF NOT EXISTS idx_seao_tenders_category ON seao_tenders(category);


-- TABLE 6: SEAO_BOOKMARKS (Favoris SEAO)
-- ============================================================

CREATE TABLE IF NOT EXISTS seao_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  tender_id VARCHAR(50) NOT NULL,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, tender_id)
);

CREATE INDEX IF NOT EXISTS idx_seao_bookmarks_user ON seao_bookmarks(user_id);

ALTER TABLE seao_bookmarks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own bookmarks" ON seao_bookmarks;
CREATE POLICY "Users can manage own bookmarks" ON seao_bookmarks
  FOR ALL USING (user_id = auth.uid());


-- TABLE 7: SEAO_TRACKING (Suivi des soumissions SEAO)
-- ============================================================

CREATE TABLE IF NOT EXISTS seao_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  tender_id VARCHAR(50) NOT NULL,
  
  status VARCHAR(20) DEFAULT 'watching' CHECK (status IN ('watching', 'preparing', 'submitted', 'won', 'lost', 'no_bid')),
  
  bid_amount DECIMAL(14,2),
  submission_date DATE,
  
  team_members TEXT[],
  documents TEXT[],
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, tender_id)
);

CREATE INDEX IF NOT EXISTS idx_seao_tracking_user ON seao_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_seao_tracking_status ON seao_tracking(status);

ALTER TABLE seao_tracking ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own tracking" ON seao_tracking;
CREATE POLICY "Users can manage own tracking" ON seao_tracking
  FOR ALL USING (user_id = auth.uid());


-- TABLE 8: SEAO_ALERTS (Alertes SEAO)
-- ============================================================

CREATE TABLE IF NOT EXISTS seao_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  
  name VARCHAR(100) NOT NULL,
  
  keywords TEXT[],
  regions TEXT[],
  categories TEXT[],
  org_types TEXT[],
  
  min_value DECIMAL(14,2),
  max_value DECIMAL(14,2),
  
  is_active BOOLEAN DEFAULT TRUE,
  email_notifications BOOLEAN DEFAULT TRUE,
  
  last_check TIMESTAMPTZ,
  matches_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seao_alerts_user ON seao_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_seao_alerts_active ON seao_alerts(is_active);

ALTER TABLE seao_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own alerts" ON seao_alerts;
CREATE POLICY "Users can manage own alerts" ON seao_alerts
  FOR ALL USING (user_id = auth.uid());


-- ============================================================
-- VUES
-- ============================================================

CREATE OR REPLACE VIEW v_contracts_summary AS
SELECT 
  c.*,
  COUNT(DISTINCT co.id) as change_orders_count,
  COALESCE(SUM(CASE WHEN co.status = 'approved' THEN co.amount ELSE 0 END), 0) as total_approved_changes,
  COUNT(DISTINCT hr.id) as holdback_releases_count
FROM contracts c
LEFT JOIN change_orders_contract co ON c.id = co.contract_id
LEFT JOIN holdback_releases hr ON c.id = hr.contract_id
GROUP BY c.id;


CREATE OR REPLACE VIEW v_seao_open_tenders AS
SELECT *
FROM seao_tenders
WHERE status = 'open'
AND closing_date >= CURRENT_DATE
ORDER BY closing_date ASC;


-- ============================================================
-- TRIGGERS
-- ============================================================

-- Trigger: Mettre a jour current_amount quand un avenant est approuve
CREATE OR REPLACE FUNCTION update_contract_on_change_order()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    UPDATE contracts
    SET 
      approved_changes = approved_changes + NEW.amount,
      current_amount = original_amount + approved_changes + NEW.amount,
      holdback_amount = (original_amount + approved_changes + NEW.amount) * (holdback_percent / 100),
      updated_at = NOW()
    WHERE id = NEW.contract_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_contract_on_co ON change_orders_contract;
CREATE TRIGGER trigger_update_contract_on_co
  AFTER INSERT OR UPDATE ON change_orders_contract
  FOR EACH ROW EXECUTE FUNCTION update_contract_on_change_order();


-- Trigger: Mettre a jour holdback_released quand une liberation est approuvee
CREATE OR REPLACE FUNCTION update_contract_holdback_released()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'released' AND (OLD.status IS NULL OR OLD.status != 'released') THEN
    UPDATE contracts
    SET 
      holdback_released = holdback_released + NEW.amount,
      updated_at = NOW()
    WHERE id = NEW.contract_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_holdback_released ON holdback_releases;
CREATE TRIGGER trigger_update_holdback_released
  AFTER INSERT OR UPDATE ON holdback_releases
  FOR EACH ROW EXECUTE FUNCTION update_contract_holdback_released();


-- Triggers updated_at
DROP TRIGGER IF EXISTS update_contracts_updated_at ON contracts;
CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_change_orders_contract_updated_at ON change_orders_contract;
CREATE TRIGGER update_change_orders_contract_updated_at
  BEFORE UPDATE ON change_orders_contract
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_seao_tracking_updated_at ON seao_tracking;
CREATE TRIGGER update_seao_tracking_updated_at
  BEFORE UPDATE ON seao_tracking
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- FIN MIGRATION PHASE 7
-- ============================================================
