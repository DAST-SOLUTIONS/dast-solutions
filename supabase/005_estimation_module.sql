-- ============================================================================
-- DAST Solutions - Module Estimation (Style ProEst)
-- Base de données d'items, assemblages avec formules, estimations
-- Exécuter dans Supabase Dashboard → SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. TABLE: cost_items (Base de données d'items/prix unitaires)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.cost_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Hiérarchie CSC MasterFormat
  division_code VARCHAR(2) NOT NULL,        -- 01, 02, 03, 04, etc.
  subdivision_code VARCHAR(4),              -- 2000, 0500, etc.
  item_code VARCHAR(4),                     -- 1000, 1010, 1020, etc.
  full_code VARCHAR(20) GENERATED ALWAYS AS (
    division_code || '.' || COALESCE(subdivision_code, '0000') || '.' || COALESCE(item_code, '0000')
  ) STORED,
  
  -- Détails
  description TEXT NOT NULL,
  description_fr TEXT,                      -- Description française
  
  -- Coûts
  unit VARCHAR(20) NOT NULL DEFAULT 'U',    -- U, Pi, Pi2, Pi3, M, M2, M3, V3, Kg, T, Hr, Forfait
  unit_cost DECIMAL(12,4) DEFAULT 0,        -- Coût unitaire total
  material_cost DECIMAL(12,4) DEFAULT 0,    -- Coût matériaux
  labor_cost DECIMAL(12,4) DEFAULT 0,       -- Coût main-d'œuvre
  equipment_cost DECIMAL(12,4) DEFAULT 0,   -- Coût équipement
  
  -- Productivité
  labor_hours DECIMAL(8,4) DEFAULT 0,       -- Heures de travail par unité
  crew_size DECIMAL(4,2) DEFAULT 1,         -- Taille d'équipe
  
  -- Métadonnées
  source VARCHAR(100),                      -- RSMeans, Custom, Import, etc.
  last_updated DATE,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_cost_items_user ON public.cost_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cost_items_division ON public.cost_items(division_code);
CREATE INDEX IF NOT EXISTS idx_cost_items_fullcode ON public.cost_items(full_code);
CREATE INDEX IF NOT EXISTS idx_cost_items_search ON public.cost_items USING gin(to_tsvector('french', description || ' ' || COALESCE(description_fr, '')));

ALTER TABLE public.cost_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cost_items_policy" ON public.cost_items;
CREATE POLICY "cost_items_policy" ON public.cost_items
  FOR ALL USING (user_id = auth.uid());

-- ============================================================================
-- 2. TABLE: cost_divisions (Divisions CSC MasterFormat)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.cost_divisions (
  code VARCHAR(2) PRIMARY KEY,
  name_en VARCHAR(255) NOT NULL,
  name_fr VARCHAR(255) NOT NULL,
  color VARCHAR(7) DEFAULT '#64748b',
  icon VARCHAR(50),
  sort_order INTEGER
);

-- Insérer les divisions CSC MasterFormat
INSERT INTO public.cost_divisions (code, name_en, name_fr, sort_order) VALUES
('01', 'General Requirements', 'Exigences générales', 1),
('02', 'Existing Conditions', 'Conditions existantes', 2),
('03', 'Concrete', 'Béton', 3),
('04', 'Masonry', 'Maçonnerie', 4),
('05', 'Metals', 'Métaux', 5),
('06', 'Wood, Plastics, Composites', 'Bois, plastiques, composites', 6),
('07', 'Thermal and Moisture Protection', 'Protection thermique et humidité', 7),
('08', 'Openings', 'Ouvertures', 8),
('09', 'Finishes', 'Finitions', 9),
('10', 'Specialties', 'Spécialités', 10),
('11', 'Equipment', 'Équipements', 11),
('12', 'Furnishings', 'Ameublement', 12),
('13', 'Special Construction', 'Construction spéciale', 13),
('14', 'Conveying Equipment', 'Équipement de transport', 14),
('21', 'Fire Suppression', 'Protection incendie', 21),
('22', 'Plumbing', 'Plomberie', 22),
('23', 'HVAC', 'CVCA', 23),
('25', 'Integrated Automation', 'Automatisation intégrée', 25),
('26', 'Electrical', 'Électricité', 26),
('27', 'Communications', 'Communications', 27),
('28', 'Electronic Safety and Security', 'Sécurité électronique', 28),
('31', 'Earthwork', 'Terrassement', 31),
('32', 'Exterior Improvements', 'Aménagement extérieur', 32),
('33', 'Utilities', 'Services publics', 33)
ON CONFLICT (code) DO UPDATE SET name_fr = EXCLUDED.name_fr;

-- ============================================================================
-- 3. TABLE: assemblies (Assemblages avec formules)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.assemblies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Identification
  division_code VARCHAR(2) NOT NULL,
  assembly_code VARCHAR(10) NOT NULL,       -- 0100, 0200, etc.
  full_code VARCHAR(20) GENERATED ALWAYS AS (division_code || '.' || assembly_code) STORED,
  
  -- Détails
  name TEXT NOT NULL,
  name_fr TEXT,
  description TEXT,
  
  -- Unité de mesure pour l'assemblage
  unit VARCHAR(20) NOT NULL DEFAULT 'Pi2',
  
  -- Variables disponibles pour formules (JSONB)
  -- Ex: ["Wall_Length", "Wall_Height", "Bond_Beam_Rows"]
  variables JSONB DEFAULT '[]'::jsonb,
  
  -- Valeurs par défaut des variables
  -- Ex: {"Wall_Length": 10, "Wall_Height": 8, "Bond_Beam_Rows": 2}
  default_values JSONB DEFAULT '{}'::jsonb,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assemblies_user ON public.assemblies(user_id);
CREATE INDEX IF NOT EXISTS idx_assemblies_division ON public.assemblies(division_code);

ALTER TABLE public.assemblies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "assemblies_policy" ON public.assemblies;
CREATE POLICY "assemblies_policy" ON public.assemblies
  FOR ALL USING (user_id = auth.uid());

-- ============================================================================
-- 4. TABLE: assembly_items (Items dans un assemblage avec formules)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.assembly_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assembly_id UUID NOT NULL REFERENCES public.assemblies(id) ON DELETE CASCADE,
  cost_item_id UUID REFERENCES public.cost_items(id) ON DELETE SET NULL,
  
  -- Peut référencer un item OU être custom
  custom_code VARCHAR(20),
  custom_description TEXT,
  custom_unit VARCHAR(20),
  custom_unit_cost DECIMAL(12,4),
  
  -- Formule de quantité (expression mathématique)
  -- Ex: "(Wall_Length * Wall_Height * 1.125) - (Wall_Length / 1.333 * Bond_Beam_Rows)"
  quantity_formula TEXT NOT NULL DEFAULT '1',
  
  -- Quantité fixe (si pas de formule)
  fixed_quantity DECIMAL(12,4),
  
  -- Ordre d'affichage
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assembly_items_assembly ON public.assembly_items(assembly_id);

ALTER TABLE public.assembly_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "assembly_items_policy" ON public.assembly_items;
CREATE POLICY "assembly_items_policy" ON public.assembly_items
  FOR ALL USING (
    assembly_id IN (SELECT id FROM public.assemblies WHERE user_id = auth.uid())
  );

-- ============================================================================
-- 5. TABLE: estimates (Estimations de projet)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  
  -- Identification
  name VARCHAR(255) NOT NULL DEFAULT 'Estimation principale',
  version INTEGER DEFAULT 1,
  status VARCHAR(50) DEFAULT 'draft',       -- draft, active, approved, archived
  
  -- Type de projet
  project_type VARCHAR(100),                -- Résidentiel, Commercial, Industriel, etc.
  
  -- Totaux calculés (mis à jour par trigger)
  total_material DECIMAL(15,2) DEFAULT 0,
  total_labor DECIMAL(15,2) DEFAULT 0,
  total_equipment DECIMAL(15,2) DEFAULT 0,
  total_subcontractor DECIMAL(15,2) DEFAULT 0,
  total_other DECIMAL(15,2) DEFAULT 0,
  subtotal DECIMAL(15,2) DEFAULT 0,
  
  -- Marges et ajustements
  overhead_percent DECIMAL(5,2) DEFAULT 0,
  overhead_amount DECIMAL(15,2) DEFAULT 0,
  profit_percent DECIMAL(5,2) DEFAULT 0,
  profit_amount DECIMAL(15,2) DEFAULT 0,
  contingency_percent DECIMAL(5,2) DEFAULT 0,
  contingency_amount DECIMAL(15,2) DEFAULT 0,
  
  -- Total final
  grand_total DECIMAL(15,2) DEFAULT 0,
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_estimates_project ON public.estimates(project_id);

ALTER TABLE public.estimates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "estimates_policy" ON public.estimates;
CREATE POLICY "estimates_policy" ON public.estimates
  FOR ALL USING (
    project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  );

-- ============================================================================
-- 6. TABLE: estimate_items (Lignes d'estimation)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.estimate_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id UUID NOT NULL REFERENCES public.estimates(id) ON DELETE CASCADE,
  
  -- Source (item de base de données, assemblage, ou custom)
  cost_item_id UUID REFERENCES public.cost_items(id) ON DELETE SET NULL,
  assembly_id UUID REFERENCES public.assemblies(id) ON DELETE SET NULL,
  
  -- Identification (peut être override)
  code VARCHAR(20),
  description TEXT NOT NULL,
  
  -- Quantité et unité
  quantity DECIMAL(12,4) NOT NULL DEFAULT 0,
  unit VARCHAR(20) NOT NULL DEFAULT 'U',
  
  -- Coûts unitaires (peuvent être override)
  material_unit_cost DECIMAL(12,4) DEFAULT 0,
  labor_unit_cost DECIMAL(12,4) DEFAULT 0,
  equipment_unit_cost DECIMAL(12,4) DEFAULT 0,
  subcontractor_unit_cost DECIMAL(12,4) DEFAULT 0,
  other_unit_cost DECIMAL(12,4) DEFAULT 0,
  
  -- Totaux calculés
  material_total DECIMAL(15,2) GENERATED ALWAYS AS (quantity * material_unit_cost) STORED,
  labor_total DECIMAL(15,2) GENERATED ALWAYS AS (quantity * labor_unit_cost) STORED,
  equipment_total DECIMAL(15,2) GENERATED ALWAYS AS (quantity * equipment_unit_cost) STORED,
  subcontractor_total DECIMAL(15,2) GENERATED ALWAYS AS (quantity * subcontractor_unit_cost) STORED,
  other_total DECIMAL(15,2) GENERATED ALWAYS AS (quantity * other_unit_cost) STORED,
  line_total DECIMAL(15,2) GENERATED ALWAYS AS (
    quantity * (material_unit_cost + labor_unit_cost + equipment_unit_cost + subcontractor_unit_cost + other_unit_cost)
  ) STORED,
  
  -- Organisation
  division_code VARCHAR(2),
  sort_order INTEGER DEFAULT 0,
  parent_id UUID REFERENCES public.estimate_items(id) ON DELETE CASCADE,  -- Pour groupement
  
  -- Lien avec Takeoff
  takeoff_measurement_id UUID,              -- Lien vers mesure du takeoff
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_estimate_items_estimate ON public.estimate_items(estimate_id);
CREATE INDEX IF NOT EXISTS idx_estimate_items_division ON public.estimate_items(division_code);

ALTER TABLE public.estimate_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "estimate_items_policy" ON public.estimate_items;
CREATE POLICY "estimate_items_policy" ON public.estimate_items
  FOR ALL USING (
    estimate_id IN (
      SELECT id FROM public.estimates WHERE project_id IN (
        SELECT id FROM public.projects WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- 7. FONCTION: Recalculer totaux estimation
-- ============================================================================

CREATE OR REPLACE FUNCTION recalculate_estimate_totals()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.estimates SET
    total_material = COALESCE((SELECT SUM(material_total) FROM public.estimate_items WHERE estimate_id = COALESCE(NEW.estimate_id, OLD.estimate_id)), 0),
    total_labor = COALESCE((SELECT SUM(labor_total) FROM public.estimate_items WHERE estimate_id = COALESCE(NEW.estimate_id, OLD.estimate_id)), 0),
    total_equipment = COALESCE((SELECT SUM(equipment_total) FROM public.estimate_items WHERE estimate_id = COALESCE(NEW.estimate_id, OLD.estimate_id)), 0),
    total_subcontractor = COALESCE((SELECT SUM(subcontractor_total) FROM public.estimate_items WHERE estimate_id = COALESCE(NEW.estimate_id, OLD.estimate_id)), 0),
    total_other = COALESCE((SELECT SUM(other_total) FROM public.estimate_items WHERE estimate_id = COALESCE(NEW.estimate_id, OLD.estimate_id)), 0),
    subtotal = COALESCE((SELECT SUM(line_total) FROM public.estimate_items WHERE estimate_id = COALESCE(NEW.estimate_id, OLD.estimate_id)), 0),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.estimate_id, OLD.estimate_id);
  
  -- Recalculer grand_total avec marges
  UPDATE public.estimates SET
    overhead_amount = subtotal * overhead_percent / 100,
    profit_amount = subtotal * profit_percent / 100,
    contingency_amount = subtotal * contingency_percent / 100,
    grand_total = subtotal + (subtotal * overhead_percent / 100) + (subtotal * profit_percent / 100) + (subtotal * contingency_percent / 100)
  WHERE id = COALESCE(NEW.estimate_id, OLD.estimate_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_recalculate_estimate ON public.estimate_items;
CREATE TRIGGER trigger_recalculate_estimate
  AFTER INSERT OR UPDATE OR DELETE ON public.estimate_items
  FOR EACH ROW EXECUTE FUNCTION recalculate_estimate_totals();

-- ============================================================================
-- 8. DONNÉES DE DÉMONSTRATION (Quelques items maçonnerie)
-- ============================================================================

-- Note: Ces données seront insérées pour l'utilisateur lors de la première connexion
-- ou via un bouton "Charger données de base"

-- ============================================================================
-- 9. TRIGGERS updated_at
-- ============================================================================

CREATE TRIGGER update_cost_items_updated_at BEFORE UPDATE ON public.cost_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assemblies_updated_at BEFORE UPDATE ON public.assemblies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_estimates_updated_at BEFORE UPDATE ON public.estimates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_estimate_items_updated_at BEFORE UPDATE ON public.estimate_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VÉRIFICATION
-- ============================================================================

SELECT '✅ Module Estimation créé!' AS status;

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('cost_items', 'cost_divisions', 'assemblies', 'assembly_items', 'estimates', 'estimate_items')
ORDER BY table_name;
