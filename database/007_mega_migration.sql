-- ============================================================================
-- DAST Solutions - MEGA Migration
-- Modules: Takeoff Sync, Facturation, Notifications, Mobile
-- Exécuter dans Supabase SQL Editor
-- ============================================================================

-- ============================================
-- MODULE B: TAKEOFF MEASURES (Sync Supabase)
-- ============================================
CREATE TABLE IF NOT EXISTS takeoff_measures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Document source
  document_id UUID,
  page_number INTEGER NOT NULL DEFAULT 1,
  
  -- Type de mesure
  type VARCHAR(20) NOT NULL CHECK (type IN ('line', 'rectangle', 'polygon', 'count', 'area')),
  
  -- Données de la mesure
  label VARCHAR(255) NOT NULL,
  value DECIMAL(15,4) NOT NULL DEFAULT 0,
  unit VARCHAR(20) NOT NULL DEFAULT 'm',
  color VARCHAR(20) DEFAULT '#3B82F6',
  
  -- Géométrie (points de la mesure)
  points JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Calibration utilisée
  scale_ratio DECIMAL(15,6) DEFAULT 1,
  
  -- Métadonnées (catégorie CSC, prix unitaire, notes)
  category VARCHAR(10),
  unit_price DECIMAL(15,2) DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Lien avec soumission
  soumission_item_id UUID,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_takeoff_measures_project ON takeoff_measures(project_id);
CREATE INDEX IF NOT EXISTS idx_takeoff_measures_user ON takeoff_measures(user_id);
CREATE INDEX IF NOT EXISTS idx_takeoff_measures_page ON takeoff_measures(project_id, page_number);

-- RLS
ALTER TABLE takeoff_measures ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "takeoff_measures_policy" ON takeoff_measures;
CREATE POLICY "takeoff_measures_policy" ON takeoff_measures
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- MODULE C: FACTURATION
-- ============================================

-- Table des factures
CREATE TABLE IF NOT EXISTS factures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Lien avec soumission (optionnel)
  soumission_id UUID REFERENCES soumissions(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  
  -- Numérotation
  facture_number VARCHAR(50) NOT NULL,
  revision INTEGER DEFAULT 1,
  
  -- Client (copié de la soumission ou saisi manuellement)
  client_name VARCHAR(255) NOT NULL,
  client_company VARCHAR(255),
  client_address TEXT,
  client_city VARCHAR(100),
  client_province VARCHAR(50) DEFAULT 'QC',
  client_postal_code VARCHAR(10),
  client_phone VARCHAR(50),
  client_email VARCHAR(255),
  
  -- Projet
  project_name VARCHAR(255),
  project_address TEXT,
  
  -- Montants
  subtotal DECIMAL(15,2) DEFAULT 0,
  tps_rate DECIMAL(5,4) DEFAULT 0.05,
  tps_amount DECIMAL(15,2) DEFAULT 0,
  tvq_rate DECIMAL(5,4) DEFAULT 0.09975,
  tvq_amount DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2) DEFAULT 0,
  
  -- Paiements
  amount_paid DECIMAL(15,2) DEFAULT 0,
  balance_due DECIMAL(15,2) DEFAULT 0,
  
  -- Dates
  date_facture DATE DEFAULT CURRENT_DATE,
  date_echeance DATE,
  date_paid DATE,
  
  -- Statut
  status VARCHAR(20) DEFAULT 'brouillon' CHECK (status IN (
    'brouillon', 'envoyee', 'payee', 'partielle', 'en_retard', 'annulee'
  )),
  
  -- Conditions
  conditions TEXT,
  notes TEXT,
  notes_internes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Items de facture
CREATE TABLE IF NOT EXISTS facture_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facture_id UUID REFERENCES factures(id) ON DELETE CASCADE,
  
  description TEXT NOT NULL,
  category VARCHAR(100),
  quantity DECIMAL(15,4) DEFAULT 1,
  unit VARCHAR(20) DEFAULT 'unité',
  unit_price DECIMAL(15,2) DEFAULT 0,
  total_price DECIMAL(15,2) DEFAULT 0,
  
  sort_order INTEGER DEFAULT 0,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Paiements reçus
CREATE TABLE IF NOT EXISTS paiements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facture_id UUID REFERENCES factures(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  montant DECIMAL(15,2) NOT NULL,
  date_paiement DATE DEFAULT CURRENT_DATE,
  
  methode VARCHAR(50) CHECK (methode IN (
    'virement', 'cheque', 'comptant', 'carte', 'autre'
  )),
  
  reference VARCHAR(100),
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index factures
CREATE INDEX IF NOT EXISTS idx_factures_user ON factures(user_id);
CREATE INDEX IF NOT EXISTS idx_factures_project ON factures(project_id);
CREATE INDEX IF NOT EXISTS idx_factures_status ON factures(status);
CREATE INDEX IF NOT EXISTS idx_factures_date ON factures(date_facture);
CREATE INDEX IF NOT EXISTS idx_facture_items_facture ON facture_items(facture_id);
CREATE INDEX IF NOT EXISTS idx_paiements_facture ON paiements(facture_id);

-- RLS factures
ALTER TABLE factures ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "factures_policy" ON factures;
CREATE POLICY "factures_policy" ON factures
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE facture_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "facture_items_policy" ON facture_items;
CREATE POLICY "facture_items_policy" ON facture_items
  FOR ALL TO authenticated
  USING (facture_id IN (SELECT id FROM factures WHERE user_id = auth.uid()))
  WITH CHECK (facture_id IN (SELECT id FROM factures WHERE user_id = auth.uid()));

ALTER TABLE paiements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "paiements_policy" ON paiements;
CREATE POLICY "paiements_policy" ON paiements
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- MODULE D: NOTIFICATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Type de notification
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'soumission_expire', 'facture_echeance', 'facture_retard',
    'rbq_expire', 'ccq_certification_expire', 'rappel_projet',
    'nouveau_message', 'systeme'
  )),
  
  -- Contenu
  title VARCHAR(255) NOT NULL,
  message TEXT,
  
  -- Lien vers l'objet concerné
  reference_type VARCHAR(50),
  reference_id UUID,
  
  -- Priorité
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- Statut
  read_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  
  -- Email envoyé?
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMPTZ,
  
  -- Dates
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Préférences de notification
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Email notifications
  email_soumission_expire BOOLEAN DEFAULT TRUE,
  email_facture_echeance BOOLEAN DEFAULT TRUE,
  email_facture_retard BOOLEAN DEFAULT TRUE,
  email_rbq_expire BOOLEAN DEFAULT TRUE,
  email_ccq_expire BOOLEAN DEFAULT TRUE,
  email_rappel_projet BOOLEAN DEFAULT TRUE,
  
  -- Push notifications (futur)
  push_enabled BOOLEAN DEFAULT FALSE,
  
  -- Délais de rappel (jours avant expiration)
  days_before_soumission INTEGER DEFAULT 7,
  days_before_facture INTEGER DEFAULT 3,
  days_before_rbq INTEGER DEFAULT 30,
  days_before_ccq INTEGER DEFAULT 30,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON notifications(scheduled_for) WHERE email_sent = FALSE;

-- RLS notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notifications_policy" ON notifications;
CREATE POLICY "notifications_policy" ON notifications
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notification_preferences_policy" ON notification_preferences;
CREATE POLICY "notification_preferences_policy" ON notification_preferences
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- MODULE E: RAPPORTS TERRAIN (Mobile)
-- ============================================

CREATE TABLE IF NOT EXISTS rapports_terrain (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Info rapport
  date_rapport DATE DEFAULT CURRENT_DATE,
  titre VARCHAR(255),
  
  -- Météo
  meteo_condition VARCHAR(50),
  meteo_temperature INTEGER,
  
  -- Localisation
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  adresse TEXT,
  
  -- Contenu
  description TEXT,
  travaux_effectues TEXT,
  problemes_rencontres TEXT,
  decisions_prises TEXT,
  
  -- Personnel présent
  personnel_present JSONB DEFAULT '[]'::jsonb,
  sous_traitants_present JSONB DEFAULT '[]'::jsonb,
  
  -- Heures
  heure_debut TIME,
  heure_fin TIME,
  heures_total DECIMAL(5,2),
  
  -- Statut
  status VARCHAR(20) DEFAULT 'brouillon' CHECK (status IN ('brouillon', 'soumis', 'approuve')),
  
  -- Signature
  signature_data TEXT,
  signed_by VARCHAR(255),
  signed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Photos du rapport
CREATE TABLE IF NOT EXISTS rapport_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rapport_id UUID REFERENCES rapports_terrain(id) ON DELETE CASCADE,
  
  -- Photo
  storage_path TEXT NOT NULL,
  url TEXT,
  thumbnail_url TEXT,
  
  -- Métadonnées
  filename VARCHAR(255),
  description TEXT,
  
  -- Localisation de la photo
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index rapports
CREATE INDEX IF NOT EXISTS idx_rapports_terrain_user ON rapports_terrain(user_id);
CREATE INDEX IF NOT EXISTS idx_rapports_terrain_project ON rapports_terrain(project_id);
CREATE INDEX IF NOT EXISTS idx_rapports_terrain_date ON rapports_terrain(date_rapport);
CREATE INDEX IF NOT EXISTS idx_rapport_photos_rapport ON rapport_photos(rapport_id);

-- RLS rapports
ALTER TABLE rapports_terrain ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rapports_terrain_policy" ON rapports_terrain;
CREATE POLICY "rapports_terrain_policy" ON rapports_terrain
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE rapport_photos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rapport_photos_policy" ON rapport_photos;
CREATE POLICY "rapport_photos_policy" ON rapport_photos
  FOR ALL TO authenticated
  USING (rapport_id IN (SELECT id FROM rapports_terrain WHERE user_id = auth.uid()))
  WITH CHECK (rapport_id IN (SELECT id FROM rapports_terrain WHERE user_id = auth.uid()));

-- ============================================
-- FONCTIONS UTILITAIRES
-- ============================================

-- Générer numéro de facture
CREATE OR REPLACE FUNCTION generate_facture_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  seq_num INTEGER;
  new_number TEXT;
BEGIN
  year_part := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(facture_number FROM 'FACT-' || year_part || '-(\d+)') AS INTEGER)
  ), 0) + 1
  INTO seq_num
  FROM factures
  WHERE facture_number LIKE 'FACT-' || year_part || '-%';
  
  new_number := 'FACT-' || year_part || '-' || LPAD(seq_num::TEXT, 4, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Mettre à jour balance facture après paiement
CREATE OR REPLACE FUNCTION update_facture_balance()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE factures
  SET 
    amount_paid = (SELECT COALESCE(SUM(montant), 0) FROM paiements WHERE facture_id = NEW.facture_id),
    balance_due = total - (SELECT COALESCE(SUM(montant), 0) FROM paiements WHERE facture_id = NEW.facture_id),
    status = CASE 
      WHEN total <= (SELECT COALESCE(SUM(montant), 0) FROM paiements WHERE facture_id = NEW.facture_id) THEN 'payee'
      WHEN (SELECT COALESCE(SUM(montant), 0) FROM paiements WHERE facture_id = NEW.facture_id) > 0 THEN 'partielle'
      ELSE status
    END,
    date_paid = CASE 
      WHEN total <= (SELECT COALESCE(SUM(montant), 0) FROM paiements WHERE facture_id = NEW.facture_id) THEN CURRENT_DATE
      ELSE NULL
    END,
    updated_at = NOW()
  WHERE id = NEW.facture_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_paiement_insert ON paiements;
CREATE TRIGGER on_paiement_insert
  AFTER INSERT ON paiements
  FOR EACH ROW EXECUTE FUNCTION update_facture_balance();

-- ============================================
-- VÉRIFICATION
-- ============================================
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columns
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN (
    'takeoff_measures', 'factures', 'facture_items', 'paiements',
    'notifications', 'notification_preferences', 
    'rapports_terrain', 'rapport_photos'
  )
ORDER BY table_name;
