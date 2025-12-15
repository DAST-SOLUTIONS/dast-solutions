-- ============================================================================
-- DAST Solutions - Migration Takeoff + GEstimator
-- Persistance des mesures, listes de prix, équipes de travail
-- ============================================================================

-- ============================================================================
-- 1. PLANS ET MESURES
-- ============================================================================

-- Plans uploadés
CREATE TABLE IF NOT EXISTS takeoff_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_type VARCHAR(20) NOT NULL, -- pdf, jpg, png, dwg, ifc, rvt
  file_size BIGINT DEFAULT 0,
  page_count INTEGER DEFAULT 1,
  
  -- Échelle
  scale_x DECIMAL(10,6) DEFAULT 0.02, -- mètres par pixel
  scale_y DECIMAL(10,6) DEFAULT 0.02,
  scale_unit VARCHAR(10) DEFAULT 'metric', -- metric, imperial
  
  -- Métadonnées
  thumbnail TEXT,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX idx_takeoff_plans_project ON takeoff_plans(project_id);
CREATE INDEX idx_takeoff_plans_user ON takeoff_plans(user_id);

-- Mesures sur les plans
CREATE TABLE IF NOT EXISTS takeoff_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES takeoff_plans(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Identification
  label VARCHAR(255),
  description TEXT,
  category VARCHAR(100) NOT NULL,
  color VARCHAR(20) DEFAULT '#3B82F6',
  
  -- Type et géométrie
  measure_type VARCHAR(20) NOT NULL, -- line, rectangle, area, count
  points JSONB, -- [{x, y}, ...]
  page_number INTEGER DEFAULT 1,
  
  -- Valeur principale
  value DECIMAL(15,4) NOT NULL,
  unit VARCHAR(20) NOT NULL, -- m, m², m³, unité
  
  -- Dimensions additionnelles
  height DECIMAL(10,4),
  width DECIMAL(10,4),
  depth DECIMAL(10,4),
  thickness DECIMAL(10,4),
  quantity INTEGER DEFAULT 1,
  
  -- Valeurs calculées
  calculated_length DECIMAL(15,4),
  calculated_area DECIMAL(15,4),
  calculated_volume DECIMAL(15,6),
  calculated_count INTEGER,
  
  -- Coûts main-d'œuvre
  labor_trade_code VARCHAR(20),
  labor_trade_name VARCHAR(100),
  labor_hourly_rate DECIMAL(10,2),
  labor_hours DECIMAL(10,2),
  labor_cost DECIMAL(15,2),
  
  -- Coûts matériaux
  material_id UUID REFERENCES materials(id),
  material_name VARCHAR(255),
  material_unit VARCHAR(20),
  material_unit_price DECIMAL(15,4),
  material_quantity DECIMAL(15,4),
  material_cost DECIMAL(15,2),
  
  -- Équipe assignée
  crew_id UUID REFERENCES work_crews(id),
  
  -- Totaux
  total_cost DECIMAL(15,2),
  markup_percent DECIMAL(5,2) DEFAULT 0,
  total_with_markup DECIMAL(15,2),
  
  -- Métadonnées
  notes TEXT,
  exported_to_bid BOOLEAN DEFAULT FALSE,
  bid_item_id UUID,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_takeoff_measurements_plan ON takeoff_measurements(plan_id);
CREATE INDEX idx_takeoff_measurements_project ON takeoff_measurements(project_id);
CREATE INDEX idx_takeoff_measurements_category ON takeoff_measurements(category);

-- ============================================================================
-- 2. LISTES DE PRIX MATÉRIAUX
-- ============================================================================

-- Listes de prix (peuvent être importées)
CREATE TABLE IF NOT EXISTS material_price_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  source VARCHAR(100), -- Fournisseur, date d'import
  currency VARCHAR(3) DEFAULT 'CAD',
  
  -- Validité
  effective_date DATE DEFAULT CURRENT_DATE,
  expiry_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Import
  imported_from VARCHAR(50), -- excel, csv, manual
  original_filename VARCHAR(255),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Matériaux dans les listes
CREATE TABLE IF NOT EXISTS materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  price_list_id UUID REFERENCES material_price_lists(id) ON DELETE CASCADE,
  
  -- Identification
  code VARCHAR(50),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  subcategory VARCHAR(100),
  
  -- Prix
  unit VARCHAR(30) NOT NULL, -- m², m³, kg, unité, pmp, etc.
  unit_price DECIMAL(15,4) NOT NULL,
  min_quantity DECIMAL(10,2) DEFAULT 1,
  
  -- Fournisseur
  supplier VARCHAR(255),
  supplier_code VARCHAR(50),
  
  -- Métadonnées
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_materials_price_list ON materials(price_list_id);
CREATE INDEX idx_materials_category ON materials(category);
CREATE INDEX idx_materials_code ON materials(code);

-- ============================================================================
-- 3. ÉQUIPES DE TRAVAIL
-- ============================================================================

-- Équipes
CREATE TABLE IF NOT EXISTS work_crews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  specialty VARCHAR(100), -- Maçonnerie, Coffrage, etc.
  
  -- Productivité de base
  default_productivity DECIMAL(10,4), -- unités par heure
  productivity_unit VARCHAR(30), -- m²/h, m³/h, unité/h
  
  -- Coût horaire total de l'équipe
  hourly_cost DECIMAL(10,2),
  
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Membres d'équipe
CREATE TABLE IF NOT EXISTS crew_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crew_id UUID REFERENCES work_crews(id) ON DELETE CASCADE,
  
  -- Identification
  name VARCHAR(255),
  trade_code VARCHAR(20), -- Code CCQ
  trade_name VARCHAR(100),
  
  -- Classification
  classification VARCHAR(50), -- Compagnon, Apprenti 1, 2, 3
  
  -- Taux
  hourly_rate DECIMAL(10,2) NOT NULL,
  
  -- Quantité dans l'équipe
  quantity INTEGER DEFAULT 1,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Équipements
CREATE TABLE IF NOT EXISTS equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- Levage, Excavation, Coffrage, etc.
  
  -- Coûts
  hourly_rate DECIMAL(10,2),
  daily_rate DECIMAL(10,2),
  weekly_rate DECIMAL(10,2),
  monthly_rate DECIMAL(10,2),
  
  -- Opérateur requis?
  requires_operator BOOLEAN DEFAULT FALSE,
  operator_trade_code VARCHAR(20),
  
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Équipements assignés aux équipes
CREATE TABLE IF NOT EXISTS crew_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crew_id UUID REFERENCES work_crews(id) ON DELETE CASCADE,
  equipment_id UUID REFERENCES equipment(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. TAUX DE PRODUCTIVITÉ
-- ============================================================================

-- Productivité par type de travail
CREATE TABLE IF NOT EXISTS productivity_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Identification
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- Même catégories que takeoff
  
  -- Taux
  unit VARCHAR(30) NOT NULL, -- m²/h, m³/h, unité/h
  rate DECIMAL(10,4) NOT NULL, -- Quantité par heure
  
  -- Conditions
  difficulty_factor DECIMAL(4,2) DEFAULT 1.0, -- 1.0 = normal, 1.5 = difficile
  weather_factor DECIMAL(4,2) DEFAULT 1.0,
  
  -- Équipe type requise
  crew_id UUID REFERENCES work_crews(id),
  
  -- Source
  source VARCHAR(100), -- Manuel, RS Means, Historique
  
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. LIAISON TAKEOFF → SOUMISSION
-- ============================================================================

-- Items de soumission générés depuis takeoff
CREATE TABLE IF NOT EXISTS bid_items_from_takeoff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_id UUID, -- Référence vers la soumission
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Source takeoff
  measurement_ids UUID[], -- Liste des mesures agrégées
  category VARCHAR(100),
  
  -- Description
  item_number VARCHAR(20),
  description TEXT NOT NULL,
  
  -- Quantités
  quantity DECIMAL(15,4) NOT NULL,
  unit VARCHAR(30) NOT NULL,
  
  -- Coûts
  material_cost DECIMAL(15,2) DEFAULT 0,
  labor_cost DECIMAL(15,2) DEFAULT 0,
  equipment_cost DECIMAL(15,2) DEFAULT 0,
  subtotal DECIMAL(15,2) DEFAULT 0,
  
  -- Marges
  overhead_percent DECIMAL(5,2) DEFAULT 10,
  profit_percent DECIMAL(5,2) DEFAULT 10,
  
  -- Total
  total_cost DECIMAL(15,2),
  unit_price DECIMAL(15,4),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 6. TRIGGERS ET FONCTIONS
-- ============================================================================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_takeoff_plans_updated_at
  BEFORE UPDATE ON takeoff_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_takeoff_measurements_updated_at
  BEFORE UPDATE ON takeoff_measurements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_material_price_lists_updated_at
  BEFORE UPDATE ON material_price_lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_materials_updated_at
  BEFORE UPDATE ON materials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_crews_updated_at
  BEFORE UPDATE ON work_crews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipment_updated_at
  BEFORE UPDATE ON equipment
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. RLS (Row Level Security)
-- ============================================================================

ALTER TABLE takeoff_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE takeoff_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_price_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_crews ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE productivity_rates ENABLE ROW LEVEL SECURITY;

-- Politiques
CREATE POLICY "Users can manage their own takeoff_plans"
  ON takeoff_plans FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own takeoff_measurements"
  ON takeoff_measurements FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own price_lists"
  ON material_price_lists FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view materials in their price_lists"
  ON materials FOR ALL
  USING (price_list_id IN (SELECT id FROM material_price_lists WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their own work_crews"
  ON work_crews FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage crew_members in their crews"
  ON crew_members FOR ALL
  USING (crew_id IN (SELECT id FROM work_crews WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their own equipment"
  ON equipment FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own productivity_rates"
  ON productivity_rates FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================================
-- 8. DONNÉES DE BASE
-- ============================================================================

-- Insérer les catégories de matériaux par défaut dans une liste système
INSERT INTO material_price_lists (id, user_id, name, description, source, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  NULL, -- Liste système
  'Matériaux standards Québec 2024',
  'Liste de prix de référence pour matériaux courants',
  'DAST Solutions',
  TRUE
) ON CONFLICT DO NOTHING;

-- Matériaux de base
INSERT INTO materials (price_list_id, code, name, category, unit, unit_price) VALUES
('00000000-0000-0000-0000-000000000001', 'BET-30', 'Béton 30 MPa', 'Béton', 'm³', 185.00),
('00000000-0000-0000-0000-000000000001', 'BET-25', 'Béton 25 MPa', 'Béton', 'm³', 170.00),
('00000000-0000-0000-0000-000000000001', 'BET-35', 'Béton 35 MPa', 'Béton', 'm³', 200.00),
('00000000-0000-0000-0000-000000000001', 'ARM-10M', 'Armature 10M', 'Acier', 'kg', 2.50),
('00000000-0000-0000-0000-000000000001', 'ARM-15M', 'Armature 15M', 'Acier', 'kg', 2.45),
('00000000-0000-0000-0000-000000000001', 'ARM-20M', 'Armature 20M', 'Acier', 'kg', 2.40),
('00000000-0000-0000-0000-000000000001', 'BRIQ-STD', 'Brique standard', 'Maçonnerie', 'unité', 0.85),
('00000000-0000-0000-0000-000000000001', 'BLOC-20', 'Bloc de béton 20cm', 'Maçonnerie', 'unité', 3.50),
('00000000-0000-0000-0000-000000000001', 'BLOC-15', 'Bloc de béton 15cm', 'Maçonnerie', 'unité', 2.80),
('00000000-0000-0000-0000-000000000001', 'BOIS-2X4', 'Bois 2x4 SPF #2', 'Bois', 'pmp', 0.95),
('00000000-0000-0000-0000-000000000001', 'BOIS-2X6', 'Bois 2x6 SPF #2', 'Bois', 'pmp', 1.10),
('00000000-0000-0000-0000-000000000001', 'BOIS-2X8', 'Bois 2x8 SPF #2', 'Bois', 'pmp', 1.35),
('00000000-0000-0000-0000-000000000001', 'BOIS-2X10', 'Bois 2x10 SPF #2', 'Bois', 'pmp', 1.55),
('00000000-0000-0000-0000-000000000001', 'PLY-18', 'Contreplaqué 18mm', 'Bois', 'feuille', 65.00),
('00000000-0000-0000-0000-000000000001', 'PLY-12', 'Contreplaqué 12mm', 'Bois', 'feuille', 48.00),
('00000000-0000-0000-0000-000000000001', 'GYP-12', 'Gypse 1/2"', 'Finition', 'feuille', 18.00),
('00000000-0000-0000-0000-000000000001', 'GYP-58', 'Gypse 5/8"', 'Finition', 'feuille', 22.00),
('00000000-0000-0000-0000-000000000001', 'ISO-R20', 'Isolant R-20', 'Isolation', 'm²', 12.00),
('00000000-0000-0000-0000-000000000001', 'ISO-R30', 'Isolant R-30', 'Isolation', 'm²', 18.00),
('00000000-0000-0000-0000-000000000001', 'ISO-R40', 'Isolant R-40', 'Isolation', 'm²', 24.00),
('00000000-0000-0000-0000-000000000001', 'BARD-ASP', 'Bardeaux asphalte', 'Toiture', 'paquet', 35.00),
('00000000-0000-0000-0000-000000000001', 'MEMB-ELAST', 'Membrane élastomère', 'Toiture', 'm²', 45.00),
('00000000-0000-0000-0000-000000000001', 'PEIN-INT', 'Peinture latex intérieur', 'Peinture', 'litre', 45.00),
('00000000-0000-0000-0000-000000000001', 'PEIN-EXT', 'Peinture latex extérieur', 'Peinture', 'litre', 55.00)
ON CONFLICT DO NOTHING;

-- Taux de productivité de référence
INSERT INTO productivity_rates (id, user_id, name, category, unit, rate, source) VALUES
('00000000-0000-0000-0000-000000000010', NULL, 'Coffrage mur simple', 'Fondations', 'm²/h', 0.8, 'RS Means'),
('00000000-0000-0000-0000-000000000011', NULL, 'Coffrage mur complexe', 'Fondations', 'm²/h', 0.5, 'RS Means'),
('00000000-0000-0000-0000-000000000012', NULL, 'Coffrage dalle', 'Structure', 'm²/h', 1.2, 'RS Means'),
('00000000-0000-0000-0000-000000000013', NULL, 'Pose armature légère', 'Fondations', 'kg/h', 25, 'RS Means'),
('00000000-0000-0000-0000-000000000014', NULL, 'Pose armature lourde', 'Structure', 'kg/h', 18, 'RS Means'),
('00000000-0000-0000-0000-000000000015', NULL, 'Maçonnerie brique', 'Murs extérieurs', 'm²/h', 1.5, 'RS Means'),
('00000000-0000-0000-0000-000000000016', NULL, 'Maçonnerie bloc', 'Murs extérieurs', 'm²/h', 2.0, 'RS Means'),
('00000000-0000-0000-0000-000000000017', NULL, 'Pose gypse', 'Finitions', 'm²/h', 4.0, 'RS Means'),
('00000000-0000-0000-0000-000000000018', NULL, 'Peinture 2 couches', 'Finitions', 'm²/h', 8.0, 'RS Means'),
('00000000-0000-0000-0000-000000000019', NULL, 'Isolation mur', 'Murs extérieurs', 'm²/h', 6.0, 'RS Means')
ON CONFLICT DO NOTHING;
