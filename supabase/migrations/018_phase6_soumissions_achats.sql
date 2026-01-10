-- ============================================================
-- DAST Solutions - Phase 6: Soumissions & Achats
-- Module complet de gestion des appels d'offres et bons de commande
-- ============================================================

-- ============================================================
-- PARTIE A: SOUMISSIONS & APPELS D'OFFRES
-- ============================================================

-- 1. TABLE BID_PACKAGES (Packages de soumission)
-- ============================================================

CREATE TABLE IF NOT EXISTS bid_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  project_id UUID,
  
  -- Identification
  package_number VARCHAR(20) NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  trade_category VARCHAR(50),
  scope_of_work TEXT,
  
  -- Dates
  issue_date TIMESTAMPTZ DEFAULT NOW(),
  due_date TIMESTAMPTZ NOT NULL,
  site_visit_date TIMESTAMPTZ,
  award_date TIMESTAMPTZ,
  
  -- Montants
  budget_estimate DECIMAL(14,2),
  awarded_amount DECIMAL(14,2),
  
  -- Status
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'closed', 'evaluating', 'awarded', 'cancelled')),
  
  -- Documents (arrays de storage paths ou URLs)
  documents TEXT[] DEFAULT '{}',
  drawings TEXT[] DEFAULT '{}',
  specifications TEXT[] DEFAULT '{}',
  
  -- Stats calculés
  invitations_count INTEGER DEFAULT 0,
  responses_count INTEGER DEFAULT 0,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bid_packages_user ON bid_packages(user_id);
CREATE INDEX IF NOT EXISTS idx_bid_packages_project ON bid_packages(project_id);
CREATE INDEX IF NOT EXISTS idx_bid_packages_status ON bid_packages(status);
CREATE INDEX IF NOT EXISTS idx_bid_packages_due ON bid_packages(due_date);

ALTER TABLE bid_packages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own bid packages" ON bid_packages;
CREATE POLICY "Users can manage own bid packages" ON bid_packages
  FOR ALL USING (user_id = auth.uid());


-- 2. TABLE BID_INVITATIONS (Invitations aux soumissionnaires)
-- ============================================================

CREATE TABLE IF NOT EXISTS bid_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_package_id UUID REFERENCES bid_packages(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies_quebec(id),
  
  -- Info entreprise (dénormalisé pour historique)
  company_name VARCHAR(200),
  company_email VARCHAR(255),
  company_phone VARCHAR(20),
  
  -- Status du processus
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'viewed', 'declined', 'submitted')),
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  
  -- Soumission reçue
  bid_amount DECIMAL(14,2),
  bid_notes TEXT,
  inclusions TEXT,
  exclusions TEXT,
  alternates TEXT,
  validity_days INTEGER DEFAULT 30,
  
  -- Documents soumission
  bid_documents TEXT[] DEFAULT '{}',
  
  -- Évaluation
  score INTEGER CHECK (score >= 0 AND score <= 100),
  ranking INTEGER,
  is_selected BOOLEAN DEFAULT FALSE,
  evaluation_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bid_invitations_package ON bid_invitations(bid_package_id);
CREATE INDEX IF NOT EXISTS idx_bid_invitations_company ON bid_invitations(company_id);
CREATE INDEX IF NOT EXISTS idx_bid_invitations_status ON bid_invitations(status);

ALTER TABLE bid_invitations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage bid invitations via package" ON bid_invitations;
CREATE POLICY "Users can manage bid invitations via package" ON bid_invitations
  FOR ALL USING (
    bid_package_id IN (SELECT id FROM bid_packages WHERE user_id = auth.uid())
  );


-- 3. TABLE BID_EVALUATION_CRITERIA (Critères d'évaluation)
-- ============================================================

CREATE TABLE IF NOT EXISTS bid_evaluation_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_package_id UUID REFERENCES bid_packages(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  weight INTEGER DEFAULT 10 CHECK (weight >= 0 AND weight <= 100),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bid_criteria_package ON bid_evaluation_criteria(bid_package_id);


-- ============================================================
-- PARTIE B: ACHATS & BONS DE COMMANDE
-- ============================================================

-- 4. TABLE REQUISITIONS (Demandes d'achat)
-- ============================================================

CREATE TABLE IF NOT EXISTS requisitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  project_id UUID,
  
  -- Identification
  req_number VARCHAR(20) NOT NULL,
  requested_by VARCHAR(100),
  department VARCHAR(100),
  
  -- Status
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'converted')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- Dates
  required_date DATE,
  
  -- Justification
  justification TEXT,
  
  -- Montant
  total_estimated DECIMAL(14,2) DEFAULT 0,
  
  -- Approbation
  approved_by VARCHAR(100),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Conversion en PO
  converted_to_po_id UUID,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_requisitions_user ON requisitions(user_id);
CREATE INDEX IF NOT EXISTS idx_requisitions_project ON requisitions(project_id);
CREATE INDEX IF NOT EXISTS idx_requisitions_status ON requisitions(status);

ALTER TABLE requisitions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own requisitions" ON requisitions;
CREATE POLICY "Users can manage own requisitions" ON requisitions
  FOR ALL USING (user_id = auth.uid());


-- 5. TABLE REQUISITION_ITEMS (Lignes de réquisition)
-- ============================================================

CREATE TABLE IF NOT EXISTS requisition_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requisition_id UUID REFERENCES requisitions(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) DEFAULT 1,
  unit VARCHAR(20) DEFAULT 'ea',
  estimated_price DECIMAL(12,2) DEFAULT 0,
  suggested_vendor VARCHAR(200),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_requisition_items_req ON requisition_items(requisition_id);


-- 6. TABLE PURCHASE_ORDERS (Bons de commande)
-- ============================================================

CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  project_id UUID,
  
  -- Identification
  po_number VARCHAR(20) NOT NULL,
  vendor_id UUID,
  vendor_name VARCHAR(200),
  
  -- Référence
  requisition_id UUID REFERENCES requisitions(id),
  bid_invitation_id UUID REFERENCES bid_invitations(id),
  budget_code VARCHAR(50),
  cost_code VARCHAR(50),
  
  -- Dates
  order_date TIMESTAMPTZ DEFAULT NOW(),
  required_date DATE,
  delivery_date DATE,
  
  -- Montants
  subtotal DECIMAL(14,2) DEFAULT 0,
  tax_gst DECIMAL(12,2) DEFAULT 0,
  tax_qst DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(14,2) DEFAULT 0,
  
  -- Status
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'sent', 'partial', 'received', 'closed', 'cancelled')),
  
  -- Livraison
  delivery_address TEXT,
  delivery_instructions TEXT,
  
  -- Approbation
  requested_by VARCHAR(100),
  approved_by VARCHAR(100),
  approved_at TIMESTAMPTZ,
  
  -- Termes et conditions
  payment_terms VARCHAR(100),
  terms TEXT,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_user ON purchase_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_project ON purchase_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_vendor ON purchase_orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_date ON purchase_orders(order_date);

ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own purchase orders" ON purchase_orders;
CREATE POLICY "Users can manage own purchase orders" ON purchase_orders
  FOR ALL USING (user_id = auth.uid());


-- 7. TABLE PO_LINE_ITEMS (Lignes de bon de commande)
-- ============================================================

CREATE TABLE IF NOT EXISTS po_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL,
  
  -- Article
  item_code VARCHAR(50),
  description TEXT NOT NULL,
  unit VARCHAR(20) DEFAULT 'ea',
  
  -- Quantités et prix
  quantity DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  total_price DECIMAL(14,2) NOT NULL,
  
  -- Réception
  quantity_received DECIMAL(10,2) DEFAULT 0,
  quantity_remaining DECIMAL(10,2) GENERATED ALWAYS AS (quantity - quantity_received) STORED,
  
  -- Référence budget
  budget_code VARCHAR(50),
  cost_code VARCHAR(50),
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_po_line_items_po ON po_line_items(purchase_order_id);


-- 8. TABLE GOODS_RECEIPTS (Réceptions de marchandises)
-- ============================================================

CREATE TABLE IF NOT EXISTS goods_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
  
  -- Identification
  receipt_number VARCHAR(20) NOT NULL,
  receipt_date DATE NOT NULL,
  
  -- Récepteur
  received_by VARCHAR(100),
  
  -- Status
  status VARCHAR(20) DEFAULT 'partial' CHECK (status IN ('partial', 'complete')),
  
  -- Livraison
  delivery_note VARCHAR(100),
  carrier VARCHAR(100),
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_goods_receipts_po ON goods_receipts(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_goods_receipts_date ON goods_receipts(receipt_date);

ALTER TABLE goods_receipts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage receipts via PO" ON goods_receipts;
CREATE POLICY "Users can manage receipts via PO" ON goods_receipts
  FOR ALL USING (
    purchase_order_id IN (SELECT id FROM purchase_orders WHERE user_id = auth.uid())
  );


-- 9. TABLE GOODS_RECEIPT_ITEMS (Lignes de réception)
-- ============================================================

CREATE TABLE IF NOT EXISTS goods_receipt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goods_receipt_id UUID REFERENCES goods_receipts(id) ON DELETE CASCADE,
  po_line_item_id UUID REFERENCES po_line_items(id),
  
  quantity_received DECIMAL(10,2) NOT NULL,
  condition VARCHAR(50) DEFAULT 'good' CHECK (condition IN ('good', 'damaged', 'partial_damage', 'rejected')),
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gr_items_receipt ON goods_receipt_items(goods_receipt_id);


-- ============================================================
-- VUES
-- ============================================================

-- Vue packages avec stats
CREATE OR REPLACE VIEW v_bid_packages_summary AS
SELECT 
  bp.*,
  COUNT(DISTINCT bi.id) as total_invitations,
  COUNT(DISTINCT CASE WHEN bi.status = 'submitted' THEN bi.id END) as total_submissions,
  MIN(CASE WHEN bi.status = 'submitted' THEN bi.bid_amount END) as lowest_bid,
  MAX(CASE WHEN bi.status = 'submitted' THEN bi.bid_amount END) as highest_bid,
  AVG(CASE WHEN bi.status = 'submitted' THEN bi.bid_amount END) as average_bid
FROM bid_packages bp
LEFT JOIN bid_invitations bi ON bp.id = bi.bid_package_id
GROUP BY bp.id;


-- Vue PO avec totaux
CREATE OR REPLACE VIEW v_purchase_orders_summary AS
SELECT 
  po.*,
  COUNT(DISTINCT li.id) as line_items_count,
  SUM(li.quantity_received) as total_received,
  SUM(li.quantity) as total_ordered,
  CASE 
    WHEN SUM(li.quantity) = 0 THEN 0
    ELSE ROUND((SUM(li.quantity_received) / SUM(li.quantity)) * 100, 1)
  END as percent_received
FROM purchase_orders po
LEFT JOIN po_line_items li ON po.id = li.purchase_order_id
GROUP BY po.id;


-- ============================================================
-- TRIGGERS
-- ============================================================

-- Trigger: Mettre à jour le compteur de réponses sur bid_packages
CREATE OR REPLACE FUNCTION update_bid_package_counts()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE bid_packages
  SET 
    responses_count = (
      SELECT COUNT(*) FROM bid_invitations 
      WHERE bid_package_id = COALESCE(NEW.bid_package_id, OLD.bid_package_id)
      AND status = 'submitted'
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.bid_package_id, OLD.bid_package_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_bid_counts ON bid_invitations;
CREATE TRIGGER trigger_update_bid_counts
  AFTER INSERT OR UPDATE OR DELETE ON bid_invitations
  FOR EACH ROW EXECUTE FUNCTION update_bid_package_counts();


-- Trigger: Mettre à jour quantity_received sur PO line items
CREATE OR REPLACE FUNCTION update_po_line_received()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE po_line_items
  SET quantity_received = (
    SELECT COALESCE(SUM(quantity_received), 0)
    FROM goods_receipt_items
    WHERE po_line_item_id = COALESCE(NEW.po_line_item_id, OLD.po_line_item_id)
  )
  WHERE id = COALESCE(NEW.po_line_item_id, OLD.po_line_item_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_po_received ON goods_receipt_items;
CREATE TRIGGER trigger_update_po_received
  AFTER INSERT OR UPDATE OR DELETE ON goods_receipt_items
  FOR EACH ROW EXECUTE FUNCTION update_po_line_received();


-- Trigger: Mettre à jour status du PO quand tout est reçu
CREATE OR REPLACE FUNCTION check_po_complete()
RETURNS TRIGGER AS $$
DECLARE
  po_id UUID;
  total_qty DECIMAL;
  received_qty DECIMAL;
BEGIN
  -- Obtenir le PO ID
  SELECT purchase_order_id INTO po_id 
  FROM po_line_items 
  WHERE id = COALESCE(NEW.po_line_item_id, OLD.po_line_item_id);
  
  -- Calculer les totaux
  SELECT 
    SUM(quantity), 
    SUM(quantity_received)
  INTO total_qty, received_qty
  FROM po_line_items
  WHERE purchase_order_id = po_id;
  
  -- Mettre à jour le statut
  IF received_qty >= total_qty THEN
    UPDATE purchase_orders SET status = 'received', updated_at = NOW() WHERE id = po_id;
  ELSIF received_qty > 0 THEN
    UPDATE purchase_orders SET status = 'partial', updated_at = NOW() WHERE id = po_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;


-- Triggers updated_at
DROP TRIGGER IF EXISTS update_bid_packages_updated_at ON bid_packages;
CREATE TRIGGER update_bid_packages_updated_at
  BEFORE UPDATE ON bid_packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bid_invitations_updated_at ON bid_invitations;
CREATE TRIGGER update_bid_invitations_updated_at
  BEFORE UPDATE ON bid_invitations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_requisitions_updated_at ON requisitions;
CREATE TRIGGER update_requisitions_updated_at
  BEFORE UPDATE ON requisitions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_purchase_orders_updated_at ON purchase_orders;
CREATE TRIGGER update_purchase_orders_updated_at
  BEFORE UPDATE ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- FIN MIGRATION
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration Phase 6 (Soumissions & Achats) complétée!';
  RAISE NOTICE '';
  RAISE NOTICE '📦 SOUMISSIONS:';
  RAISE NOTICE '   - Table bid_packages créée';
  RAISE NOTICE '   - Table bid_invitations créée';
  RAISE NOTICE '   - Table bid_evaluation_criteria créée';
  RAISE NOTICE '';
  RAISE NOTICE '🛒 ACHATS:';
  RAISE NOTICE '   - Table requisitions créée';
  RAISE NOTICE '   - Table requisition_items créée';
  RAISE NOTICE '   - Table purchase_orders créée';
  RAISE NOTICE '   - Table po_line_items créée';
  RAISE NOTICE '   - Table goods_receipts créée';
  RAISE NOTICE '   - Table goods_receipt_items créée';
  RAISE NOTICE '';
  RAISE NOTICE '   - Vues et triggers configurés';
END $$;
