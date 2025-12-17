-- ============================================================================
-- DAST Solutions - MEGA UPDATE Migration
-- Takeoff complet + CRM Clients + Historique versions
-- Exécuter dans Supabase SQL Editor
-- ============================================================================

-- ============================================
-- TAKEOFF - MESURES ET PLANS
-- ============================================

-- Table des plans PDF uploadés
CREATE TABLE IF NOT EXISTS takeoff_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Fichier
  filename VARCHAR(255) NOT NULL,
  storage_path VARCHAR(500) NOT NULL,
  file_url TEXT,
  file_size INTEGER,
  page_count INTEGER DEFAULT 1,
  
  -- Métadonnées
  name VARCHAR(255),
  description TEXT,
  
  -- Ordre
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_takeoff_plans_project ON takeoff_plans(project_id);

ALTER TABLE takeoff_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "takeoff_plans_policy" ON takeoff_plans
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Table des calibrations d'échelle
CREATE TABLE IF NOT EXISTS takeoff_calibrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES takeoff_plans(id) ON DELETE CASCADE,
  page_number INTEGER DEFAULT 1,
  
  -- Points de calibration (en pixels)
  point1_x DECIMAL(10,2) NOT NULL,
  point1_y DECIMAL(10,2) NOT NULL,
  point2_x DECIMAL(10,2) NOT NULL,
  point2_y DECIMAL(10,2) NOT NULL,
  
  -- Distance réelle
  real_distance DECIMAL(10,4) NOT NULL,
  real_unit VARCHAR(20) DEFAULT 'pi', -- pi, m, po
  
  -- Échelle calculée (pixels par unité)
  pixels_per_unit DECIMAL(15,6),
  scale_ratio VARCHAR(20), -- ex: "1:50"
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_takeoff_calibrations_plan ON takeoff_calibrations(plan_id);

ALTER TABLE takeoff_calibrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "takeoff_calibrations_policy" ON takeoff_calibrations
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Table des mesures (améliorée)
DROP TABLE IF EXISTS takeoff_measures CASCADE;
CREATE TABLE takeoff_measures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES takeoff_plans(id) ON DELETE SET NULL,
  page_number INTEGER DEFAULT 1,
  
  -- Type de mesure
  type VARCHAR(20) NOT NULL CHECK (type IN ('line', 'rectangle', 'polygon', 'count', 'area')),
  
  -- Géométrie (JSON array de points)
  points JSONB NOT NULL, -- [{x: 100, y: 200}, {x: 300, y: 400}, ...]
  
  -- Valeurs calculées
  value DECIMAL(15,4) NOT NULL, -- Longueur, surface, ou count
  unit VARCHAR(20) DEFAULT 'pi', -- pi, pi², m, m², unité
  
  -- Classification
  label VARCHAR(255),
  category VARCHAR(100), -- Division CSC MasterFormat
  subcategory VARCHAR(100),
  color VARCHAR(20) DEFAULT '#14b8a6',
  
  -- Coûts
  unit_price DECIMAL(12,2) DEFAULT 0,
  total_price DECIMAL(15,2) DEFAULT 0,
  
  -- Métadonnées
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_takeoff_measures_project ON takeoff_measures(project_id);
CREATE INDEX IF NOT EXISTS idx_takeoff_measures_plan ON takeoff_measures(plan_id);
CREATE INDEX IF NOT EXISTS idx_takeoff_measures_category ON takeoff_measures(category);

ALTER TABLE takeoff_measures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "takeoff_measures_policy" ON takeoff_measures
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- CRM CLIENTS
-- ============================================

CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Type
  type VARCHAR(20) DEFAULT 'entreprise' CHECK (type IN ('particulier', 'entreprise')),
  
  -- Identification
  name VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  
  -- Contact principal
  contact_name VARCHAR(255),
  contact_title VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(50),
  mobile VARCHAR(50),
  
  -- Adresse
  address VARCHAR(255),
  city VARCHAR(100),
  province VARCHAR(50) DEFAULT 'QC',
  postal_code VARCHAR(20),
  country VARCHAR(50) DEFAULT 'Canada',
  
  -- Finances
  credit_limit DECIMAL(12,2),
  payment_terms INTEGER DEFAULT 30, -- jours
  tax_exempt BOOLEAN DEFAULT FALSE,
  
  -- Catégorisation
  category VARCHAR(50), -- résidentiel, commercial, institutionnel
  source VARCHAR(100), -- référence, web, appel, etc.
  tags TEXT[], -- tableau de tags
  
  -- Notes
  notes TEXT,
  
  -- Statut
  status VARCHAR(20) DEFAULT 'actif' CHECK (status IN ('actif', 'inactif', 'prospect')),
  
  -- Stats calculées
  total_projects INTEGER DEFAULT 0,
  total_revenue DECIMAL(15,2) DEFAULT 0,
  last_project_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_user ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clients_policy" ON clients
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- HISTORIQUE VERSIONS SOUMISSIONS
-- ============================================

CREATE TABLE IF NOT EXISTS soumission_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  soumission_id UUID REFERENCES soumissions(id) ON DELETE CASCADE,
  
  -- Version
  version_number INTEGER NOT NULL,
  
  -- Snapshot complet
  snapshot JSONB NOT NULL, -- Copie complète de la soumission
  
  -- Changements
  changes_summary TEXT,
  changed_by VARCHAR(255),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_soumission_versions ON soumission_versions(soumission_id);

ALTER TABLE soumission_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "soumission_versions_policy" ON soumission_versions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- BASE DE PRIX MATÉRIAUX
-- ============================================

CREATE TABLE IF NOT EXISTS material_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Identification
  code VARCHAR(50),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Classification CSC MasterFormat
  division VARCHAR(10),
  section VARCHAR(20),
  
  -- Prix
  unit_price DECIMAL(12,4) NOT NULL,
  unit VARCHAR(20) NOT NULL, -- pi², m², unité, kg, etc.
  currency VARCHAR(3) DEFAULT 'CAD',
  
  -- Fournisseur
  supplier VARCHAR(255),
  supplier_code VARCHAR(100),
  
  -- Validité
  effective_date DATE DEFAULT CURRENT_DATE,
  expiry_date DATE,
  
  -- Métadonnées
  source VARCHAR(100), -- manuel, import, API
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_material_prices_user ON material_prices(user_id);
CREATE INDEX IF NOT EXISTS idx_material_prices_division ON material_prices(division);
CREATE INDEX IF NOT EXISTS idx_material_prices_name ON material_prices(name);

ALTER TABLE material_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "material_prices_policy" ON material_prices
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- STORAGE BUCKET POUR PLANS
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('takeoff-plans', 'takeoff-plans', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload plans" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'takeoff-plans' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own plans" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'takeoff-plans' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own plans" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'takeoff-plans' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================
-- AJOUTER client_id AUX PROJETS SI MANQUANT
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'client_id') THEN
    ALTER TABLE projects ADD COLUMN client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================
-- VÉRIFICATION
-- ============================================

SELECT 'Tables créées:' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('takeoff_plans', 'takeoff_calibrations', 'takeoff_measures', 'clients', 'soumission_versions', 'material_prices')
ORDER BY table_name;
