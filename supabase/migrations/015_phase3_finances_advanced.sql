-- ============================================================
-- DAST Solutions - Phase 3: Finances Avancées
-- Migration SQL pour Budget, Change Orders, Payment Applications
-- Date: 2026-01-10
-- ============================================================

-- ============================================================
-- 1. TABLE BUDGET_CATEGORIES (Structure de budget par division)
-- ============================================================

CREATE TABLE IF NOT EXISTS budget_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  code VARCHAR(10) NOT NULL,
  name VARCHAR(255) NOT NULL,
  budget_amount DECIMAL(15,2) DEFAULT 0,
  committed_amount DECIMAL(15,2) DEFAULT 0,
  actual_amount DECIMAL(15,2) DEFAULT 0,
  forecasted_amount DECIMAL(15,2) DEFAULT 0,
  parent_id UUID REFERENCES budget_categories(id),
  sort_order INTEGER DEFAULT 0,
  notes TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_budget_categories_project ON budget_categories(project_id);
CREATE INDEX IF NOT EXISTS idx_budget_categories_code ON budget_categories(code);

-- RLS
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own budget categories" ON budget_categories;
CREATE POLICY "Users can manage own budget categories" ON budget_categories
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );


-- ============================================================
-- 2. TABLE COST_ENTRIES (Entrées de coûts détaillées)
-- ============================================================

CREATE TABLE IF NOT EXISTS cost_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  category_id UUID REFERENCES budget_categories(id) ON DELETE SET NULL,
  entry_number VARCHAR(20),
  date DATE NOT NULL,
  description TEXT NOT NULL,
  vendor VARCHAR(255),
  amount DECIMAL(15,2) NOT NULL,
  type VARCHAR(20) DEFAULT 'actual' CHECK (type IN ('committed', 'actual')),
  invoice_number VARCHAR(100),
  po_number VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'void')),
  attachments JSONB DEFAULT '[]'::JSONB,
  approved_by VARCHAR(255),
  approved_date TIMESTAMPTZ,
  paid_date TIMESTAMPTZ,
  notes TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_cost_entries_project ON cost_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_cost_entries_category ON cost_entries(category_id);
CREATE INDEX IF NOT EXISTS idx_cost_entries_date ON cost_entries(date);
CREATE INDEX IF NOT EXISTS idx_cost_entries_type ON cost_entries(type);

-- RLS
ALTER TABLE cost_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own cost entries" ON cost_entries;
CREATE POLICY "Users can manage own cost entries" ON cost_entries
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );


-- ============================================================
-- 3. TABLE CHANGE_ORDERS (Ordres de changement avancés)
-- ============================================================

CREATE TABLE IF NOT EXISTS change_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  co_number VARCHAR(20) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  reason VARCHAR(30) DEFAULT 'owner_request' CHECK (reason IN ('owner_request', 'design_change', 'unforeseen', 'error_omission', 'value_engineering', 'regulatory')),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'void')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  requested_by VARCHAR(255),
  requested_date DATE,
  amount DECIMAL(15,2) DEFAULT 0,
  original_amount DECIMAL(15,2) DEFAULT 0,
  cost_breakdown JSONB DEFAULT '{}'::JSONB,
  schedule_impact_days INTEGER DEFAULT 0,
  affected_divisions TEXT[],
  attachments JSONB DEFAULT '[]'::JSONB,
  approval_history JSONB DEFAULT '[]'::JSONB,
  submitted_date TIMESTAMPTZ,
  approved_by VARCHAR(255),
  approved_date TIMESTAMPTZ,
  rejected_by VARCHAR(255),
  rejected_date TIMESTAMPTZ,
  rejection_reason TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_change_orders_project ON change_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_change_orders_status ON change_orders(status);
CREATE INDEX IF NOT EXISTS idx_change_orders_number ON change_orders(co_number);

-- RLS
ALTER TABLE change_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own change orders" ON change_orders;
CREATE POLICY "Users can manage own change orders" ON change_orders
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );


-- ============================================================
-- 4. TABLE PAYMENT_APPLICATIONS (Demandes de paiement)
-- ============================================================

CREATE TABLE IF NOT EXISTS payment_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  pa_number VARCHAR(20) NOT NULL,
  period_from DATE NOT NULL,
  period_to DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'paid', 'rejected')),
  
  -- Montants principaux
  original_contract DECIMAL(15,2) DEFAULT 0,
  approved_changes DECIMAL(15,2) DEFAULT 0,
  current_contract DECIMAL(15,2) DEFAULT 0,
  work_completed_previous DECIMAL(15,2) DEFAULT 0,
  work_completed_current DECIMAL(15,2) DEFAULT 0,
  work_completed_total DECIMAL(15,2) DEFAULT 0,
  materials_stored DECIMAL(15,2) DEFAULT 0,
  gross_amount DECIMAL(15,2) DEFAULT 0,
  holdback_percent DECIMAL(5,2) DEFAULT 10,
  holdback_amount DECIMAL(15,2) DEFAULT 0,
  less_previous_payments DECIMAL(15,2) DEFAULT 0,
  net_amount_due DECIMAL(15,2) DEFAULT 0,
  
  -- Détails par ligne
  line_items JSONB DEFAULT '[]'::JSONB,
  
  -- Workflow
  submitted_date TIMESTAMPTZ,
  submitted_by VARCHAR(255),
  reviewed_date TIMESTAMPTZ,
  reviewed_by VARCHAR(255),
  approved_date TIMESTAMPTZ,
  approved_by VARCHAR(255),
  paid_date TIMESTAMPTZ,
  payment_reference VARCHAR(100),
  rejected_date TIMESTAMPTZ,
  rejection_reason TEXT,
  
  notes TEXT,
  attachments JSONB DEFAULT '[]'::JSONB,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_payment_applications_project ON payment_applications(project_id);
CREATE INDEX IF NOT EXISTS idx_payment_applications_status ON payment_applications(status);
CREATE INDEX IF NOT EXISTS idx_payment_applications_period ON payment_applications(period_from, period_to);

-- RLS
ALTER TABLE payment_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own payment applications" ON payment_applications;
CREATE POLICY "Users can manage own payment applications" ON payment_applications
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );


-- ============================================================
-- 5. TRIGGERS pour updated_at
-- ============================================================

DROP TRIGGER IF EXISTS update_budget_categories_updated_at ON budget_categories;
CREATE TRIGGER update_budget_categories_updated_at
  BEFORE UPDATE ON budget_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cost_entries_updated_at ON cost_entries;
CREATE TRIGGER update_cost_entries_updated_at
  BEFORE UPDATE ON cost_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_change_orders_updated_at ON change_orders;
CREATE TRIGGER update_change_orders_updated_at
  BEFORE UPDATE ON change_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_applications_updated_at ON payment_applications;
CREATE TRIGGER update_payment_applications_updated_at
  BEFORE UPDATE ON payment_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- 6. VUES pour reporting
-- ============================================================

-- Vue résumé budget par projet
CREATE OR REPLACE VIEW v_project_budget_summary AS
SELECT 
  project_id,
  SUM(budget_amount) as total_budget,
  SUM(committed_amount) as total_committed,
  SUM(actual_amount) as total_actual,
  SUM(forecasted_amount) as total_forecast,
  SUM(budget_amount) - SUM(forecasted_amount) as variance,
  CASE WHEN SUM(budget_amount) > 0 
    THEN ROUND((SUM(actual_amount) / SUM(budget_amount)) * 100, 2) 
    ELSE 0 
  END as percent_complete
FROM budget_categories
GROUP BY project_id;

-- Vue résumé ordres de changement par projet
CREATE OR REPLACE VIEW v_project_change_orders_summary AS
SELECT 
  project_id,
  COUNT(*) as total_cos,
  COUNT(*) FILTER (WHERE status = 'approved') as approved_cos,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_cos,
  SUM(amount) FILTER (WHERE status = 'approved') as approved_amount,
  SUM(amount) FILTER (WHERE status = 'pending') as pending_amount,
  SUM(schedule_impact_days) FILTER (WHERE status = 'approved') as total_schedule_impact
FROM change_orders
GROUP BY project_id;

-- Vue résumé paiements par projet
CREATE OR REPLACE VIEW v_project_payments_summary AS
SELECT 
  project_id,
  COUNT(*) as total_applications,
  COUNT(*) FILTER (WHERE status = 'paid') as paid_count,
  SUM(net_amount_due) FILTER (WHERE status = 'paid') as total_paid,
  SUM(net_amount_due) FILTER (WHERE status IN ('approved', 'submitted', 'under_review')) as pending_amount,
  SUM(holdback_amount) FILTER (WHERE status = 'paid') as total_holdback
FROM payment_applications
GROUP BY project_id;


-- ============================================================
-- 7. FONCTION pour mettre à jour les totaux de catégorie
-- ============================================================

CREATE OR REPLACE FUNCTION update_category_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour les totaux committed et actual de la catégorie
  UPDATE budget_categories bc
  SET 
    committed_amount = COALESCE((
      SELECT SUM(amount) FROM cost_entries 
      WHERE category_id = bc.id AND type = 'committed' AND status != 'void'
    ), 0),
    actual_amount = COALESCE((
      SELECT SUM(amount) FROM cost_entries 
      WHERE category_id = bc.id AND type = 'actual' AND status != 'void'
    ), 0),
    updated_at = NOW()
  WHERE bc.id = COALESCE(NEW.category_id, OLD.category_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mise à jour automatique
DROP TRIGGER IF EXISTS trigger_update_category_totals ON cost_entries;
CREATE TRIGGER trigger_update_category_totals
  AFTER INSERT OR UPDATE OR DELETE ON cost_entries
  FOR EACH ROW EXECUTE FUNCTION update_category_totals();


-- ============================================================
-- FIN DE LA MIGRATION PHASE 3
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration Phase 3 complétée avec succès!';
  RAISE NOTICE '   - Table budget_categories créée';
  RAISE NOTICE '   - Table cost_entries créée';
  RAISE NOTICE '   - Table change_orders créée';
  RAISE NOTICE '   - Table payment_applications créée';
  RAISE NOTICE '   - Vues de reporting créées';
  RAISE NOTICE '   - Triggers et fonctions configurés';
END $$;
