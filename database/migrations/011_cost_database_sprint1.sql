-- ============================================================================
-- DAST Solutions - Base de données coûts améliorée (type BIM)
-- Sprint 1 - Migration 001
-- ============================================================================

-- -------------------------------------------------------
-- CATÉGORIES CSC MasterFormat
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS cost_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,         -- ex: "03", "03 30 00"
  name TEXT NOT NULL,                -- ex: "Béton"
  name_en TEXT,
  parent_code TEXT REFERENCES cost_categories(code),
  level INT DEFAULT 1,               -- 1=Division, 2=Section, 3=Assembly
  color TEXT DEFAULT '#14b8a6',
  icon TEXT DEFAULT '📦',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------
-- FABRICANTS / FOURNISSEURS
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS cost_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('retailer', 'distributor', 'manufacturer', 'subcontractor')),
  website TEXT,
  phone TEXT,
  region TEXT DEFAULT 'Quebec',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fournisseurs de base québécois
INSERT INTO cost_suppliers (name, type, website, region) VALUES
  ('Rona', 'retailer', 'https://www.rona.ca', 'Quebec'),
  ('Lowes', 'retailer', 'https://www.lowes.ca', 'Quebec'),
  ('Réno-Dépôt', 'retailer', 'https://www.renodepot.com', 'Quebec'),
  ('BMR', 'retailer', 'https://www.bmr.qc.ca', 'Quebec'),
  ('Home Hardware', 'retailer', 'https://www.homehardware.ca', 'Quebec'),
  ('Patrick Morin', 'retailer', 'https://www.patrickmorin.com', 'Quebec'),
  ('Canac', 'retailer', 'https://www.canac.ca', 'Quebec'),
  ('Home Dépôt', 'retailer', 'https://www.homedepot.ca', 'Quebec'),
  ('Manugypse', 'distributor', 'https://www.manugypse.com', 'Quebec'),
  ('Lefebvre et Benoit', 'distributor', NULL, 'Quebec'),
  ('Matério', 'distributor', 'https://www.materio.com', 'Quebec'),
  ('Matériaux Pont Masson', 'distributor', 'https://www.pontmasson.com', 'Quebec'),
  ('Coupal', 'distributor', NULL, 'Quebec')
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------
-- ITEMS DE COÛTS (avec image + fiche technique BIM)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS cost_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identification
  code TEXT UNIQUE,                   -- ex: "BET-01-001"
  name TEXT NOT NULL,                 -- ex: "Béton 25 MPa"
  name_en TEXT,
  description TEXT,
  
  -- Classification CSC
  category_code TEXT REFERENCES cost_categories(code),
  csc_division TEXT,                  -- "03"
  csc_section TEXT,                   -- "03 30 00"
  
  -- Unité & mesure
  unit TEXT NOT NULL DEFAULT 'U',     -- U, M, M2, M3, PI, PI2, HR, KG, T, L, etc.
  unit_label TEXT,                    -- "unité", "mètre linéaire", etc.
  
  -- Prix (par défaut)
  price_material DECIMAL(12,4) DEFAULT 0,    -- $ matériaux
  price_labor DECIMAL(12,4) DEFAULT 0,       -- $ main-d'œuvre
  price_equipment DECIMAL(12,4) DEFAULT 0,  -- $ équipement
  price_total DECIMAL(12,4) GENERATED ALWAYS AS (
    COALESCE(price_material,0) + COALESCE(price_labor,0) + COALESCE(price_equipment,0)
  ) STORED,
  
  -- Fournisseur principal
  supplier_id UUID REFERENCES cost_suppliers(id),
  supplier_sku TEXT,                  -- Code produit chez le fournisseur
  supplier_url TEXT,                  -- Lien direct au produit
  supplier_price DECIMAL(12,4),       -- Prix catalogue fournisseur
  
  -- Média (type BIM)
  image_url TEXT,                     -- Image du produit (Supabase Storage)
  thumbnail_url TEXT,                 -- Miniature
  technical_sheet_url TEXT,           -- PDF fiche technique (Supabase Storage)
  technical_sheet_name TEXT,
  model_3d_url TEXT,                  -- Objet IFC/3D optionnel
  
  -- Specs techniques (JSON flexible type BIM)
  specifications JSONB DEFAULT '{}',  -- { "resistance": "25MPa", "slump": "120mm", ... }
  
  -- Métadonnées
  brand TEXT,                         -- Marque
  model TEXT,                         -- Modèle/référence
  standard TEXT,                      -- Norme (CSA A23.1, etc.)
  notes TEXT,
  
  -- Gestion
  is_active BOOLEAN DEFAULT TRUE,
  is_custom BOOLEAN DEFAULT FALSE,    -- Créé par l'utilisateur
  last_price_update TIMESTAMPTZ DEFAULT NOW(),
  
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------
-- ÉQUIVALENTS (dropdown d'alternatives)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS cost_item_equivalents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES cost_items(id) ON DELETE CASCADE,
  equivalent_item_id UUID NOT NULL REFERENCES cost_items(id) ON DELETE CASCADE,
  similarity_pct INT DEFAULT 100,    -- % de similarité (100 = identique)
  notes TEXT,                        -- ex: "Même résistance, fournisseur différent"
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(item_id, equivalent_item_id),
  CHECK (item_id != equivalent_item_id)
);

-- -------------------------------------------------------
-- ASSEMBLAGES / FAMILLES (type Revit)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS cost_assemblies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name TEXT NOT NULL,                 -- ex: "Mur extérieur type A - 2x6"
  code TEXT UNIQUE,
  description TEXT,
  assembly_type TEXT CHECK (assembly_type IN ('wall', 'floor', 'ceiling', 'column', 'beam', 'custom')),
  category_code TEXT REFERENCES cost_categories(code),
  unit TEXT DEFAULT 'M2',            -- Unité de base de l'assemblage
  
  -- Thumbnail de l'assemblage
  image_url TEXT,
  
  -- Specs
  specifications JSONB DEFAULT '{}', -- { "R-value": 24, "fire_rating": "1hr", ... }
  
  is_active BOOLEAN DEFAULT TRUE,
  is_custom BOOLEAN DEFAULT TRUE,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------
-- ITEMS DANS UN ASSEMBLAGE
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS cost_assembly_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assembly_id UUID NOT NULL REFERENCES cost_assemblies(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES cost_items(id),
  
  quantity DECIMAL(12,4) NOT NULL DEFAULT 1,   -- Quantité par unité d'assemblage
  unit TEXT,                                    -- Peut différer de l'item
  waste_factor DECIMAL(5,4) DEFAULT 1.00,       -- 1.10 = 10% de perte
  notes TEXT,
  sort_order INT DEFAULT 0
);

-- -------------------------------------------------------
-- HISTORIQUE DES PRIX
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS cost_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES cost_items(id) ON DELETE CASCADE,
  
  price_material_old DECIMAL(12,4),
  price_material_new DECIMAL(12,4),
  price_labor_old DECIMAL(12,4),
  price_labor_new DECIMAL(12,4),
  price_equipment_old DECIMAL(12,4),
  price_equipment_new DECIMAL(12,4),
  
  supplier_id UUID REFERENCES cost_suppliers(id),
  change_reason TEXT,                -- "Mise à jour Rona Mars 2026"
  changed_by UUID,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------
-- INDEXES
-- -------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_cost_items_category ON cost_items(category_code);
CREATE INDEX IF NOT EXISTS idx_cost_items_csc ON cost_items(csc_division, csc_section);
CREATE INDEX IF NOT EXISTS idx_cost_items_active ON cost_items(is_active);
CREATE INDEX IF NOT EXISTS idx_cost_items_name ON cost_items USING gin(to_tsvector('french', name));
CREATE INDEX IF NOT EXISTS idx_cost_assembly_items_assembly ON cost_assembly_items(assembly_id);
CREATE INDEX IF NOT EXISTS idx_cost_equivalents_item ON cost_item_equivalents(item_id);

-- -------------------------------------------------------
-- RLS (Row Level Security)
-- -------------------------------------------------------
ALTER TABLE cost_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_assemblies ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_item_equivalents ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_assembly_items ENABLE ROW LEVEL SECURITY;

-- Lecture : tous les utilisateurs authentifiés
CREATE POLICY "cost_items_read" ON cost_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "cost_assemblies_read" ON cost_assemblies FOR SELECT TO authenticated USING (true);
CREATE POLICY "cost_equivalents_read" ON cost_item_equivalents FOR SELECT TO authenticated USING (true);
CREATE POLICY "cost_assembly_items_read" ON cost_assembly_items FOR SELECT TO authenticated USING (true);

-- Écriture : utilisateurs authentifiés peuvent modifier
CREATE POLICY "cost_items_write" ON cost_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "cost_assemblies_write" ON cost_assemblies FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "cost_equivalents_write" ON cost_item_equivalents FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "cost_assembly_items_write" ON cost_assembly_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- -------------------------------------------------------
-- CATÉGORIES CSC DE BASE
-- -------------------------------------------------------
INSERT INTO cost_categories (code, name, name_en, level, sort_order) VALUES
  ('00', 'Conditions générales', 'General Conditions', 1, 0),
  ('01', 'Exigences générales', 'General Requirements', 1, 1),
  ('02', 'Travaux existants', 'Existing Conditions', 1, 2),
  ('03', 'Béton', 'Concrete', 1, 3),
  ('04', 'Maçonnerie', 'Masonry', 1, 4),
  ('05', 'Métaux', 'Metals', 1, 5),
  ('06', 'Bois et plastiques', 'Wood, Plastics, Composites', 1, 6),
  ('07', 'Isolation et étanchéité', 'Thermal and Moisture Protection', 1, 7),
  ('08', 'Ouvertures', 'Openings', 1, 8),
  ('09', 'Finitions', 'Finishes', 1, 9),
  ('10', 'Ouvrages spéciaux', 'Specialties', 1, 10),
  ('11', 'Équipement', 'Equipment', 1, 11),
  ('12', 'Ameublement', 'Furnishings', 1, 12),
  ('13', 'Bâtiment spéciaux', 'Special Construction', 1, 13),
  ('14', 'Systèmes transporteurs', 'Conveying Equipment', 1, 14),
  ('21', 'Gicleurs', 'Fire Suppression', 1, 21),
  ('22', 'Plomberie', 'Plumbing', 1, 22),
  ('23', 'CVC', 'HVAC', 1, 23),
  ('26', 'Électricité', 'Electrical', 1, 26),
  ('31', 'Terrassement', 'Earthwork', 1, 31),
  ('32', 'Aménagements ext.', 'Exterior Improvements', 1, 32),
  ('33', 'Services publics', 'Utilities', 1, 33)
ON CONFLICT (code) DO NOTHING;

-- Fonction trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cost_items_updated_at BEFORE UPDATE ON cost_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER cost_assemblies_updated_at BEFORE UPDATE ON cost_assemblies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
