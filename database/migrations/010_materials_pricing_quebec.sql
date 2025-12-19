-- ============================================================
-- DAST Solutions - Base de données Prix Matériaux Québec
-- Migration 010 - Système complet de pricing
-- ============================================================

-- ============================================================
-- CATÉGORIES CSC MASTERFORMAT (Divisions 01-49)
-- ============================================================
CREATE TABLE IF NOT EXISTS material_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  division_code VARCHAR(2) NOT NULL,
  division_name VARCHAR(100) NOT NULL,
  subdivision_code VARCHAR(10),
  subdivision_name VARCHAR(200),
  description TEXT,
  icon VARCHAR(50),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_material_categories_division ON material_categories(division_code);
CREATE INDEX IF NOT EXISTS idx_material_categories_active ON material_categories(is_active);

-- ============================================================
-- MATÉRIAUX ET PRODUITS
-- ============================================================
CREATE TABLE IF NOT EXISTS materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES material_categories(id),
  
  -- Identification
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  name_en VARCHAR(200),
  description TEXT,
  
  -- Unités et mesures
  unit VARCHAR(20) NOT NULL, -- pi², pi.lin, m², m³, unité, kg, lb, etc.
  unit_fr VARCHAR(30),
  default_quantity DECIMAL(10,2) DEFAULT 1,
  
  -- Prix
  unit_price DECIMAL(12,4) NOT NULL,
  price_type VARCHAR(20) DEFAULT 'material', -- material, labor, equipment, subcontract
  currency VARCHAR(3) DEFAULT 'CAD',
  
  -- Fournisseur/Source
  supplier VARCHAR(100),
  supplier_code VARCHAR(50),
  manufacturer VARCHAR(100),
  
  -- Métadonnées prix
  price_date DATE DEFAULT CURRENT_DATE,
  price_source VARCHAR(50), -- manual, rsmeans, supplier, import
  price_region VARCHAR(50) DEFAULT 'quebec',
  
  -- Facteurs de calcul
  waste_factor DECIMAL(5,2) DEFAULT 0, -- % de perte
  coverage_rate DECIMAL(10,4), -- Taux de couverture (ex: 1 gal = 400 pi²)
  labor_hours_per_unit DECIMAL(6,3), -- Heures main-d'oeuvre par unité
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_favorite BOOLEAN DEFAULT false,
  tags TEXT[], -- Pour recherche
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category_id);
CREATE INDEX IF NOT EXISTS idx_materials_code ON materials(code);
CREATE INDEX IF NOT EXISTS idx_materials_name ON materials(name);
CREATE INDEX IF NOT EXISTS idx_materials_active ON materials(is_active);
CREATE INDEX IF NOT EXISTS idx_materials_favorite ON materials(is_favorite);
CREATE INDEX IF NOT EXISTS idx_materials_tags ON materials USING GIN(tags);

-- Recherche full-text
CREATE INDEX IF NOT EXISTS idx_materials_search ON materials 
  USING GIN(to_tsvector('french', coalesce(name, '') || ' ' || coalesce(description, '')));

-- ============================================================
-- HISTORIQUE DES PRIX
-- ============================================================
CREATE TABLE IF NOT EXISTS material_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
  unit_price DECIMAL(12,4) NOT NULL,
  price_date DATE NOT NULL,
  price_source VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_history_material ON material_price_history(material_id);
CREATE INDEX IF NOT EXISTS idx_price_history_date ON material_price_history(price_date);

-- ============================================================
-- ASSEMBLAGES (Groupes de matériaux)
-- ============================================================
CREATE TABLE IF NOT EXISTS material_assemblies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category_id UUID REFERENCES material_categories(id),
  unit VARCHAR(20) NOT NULL,
  
  -- Prix calculé
  total_material_cost DECIMAL(12,4),
  total_labor_cost DECIMAL(12,4),
  total_equipment_cost DECIMAL(12,4),
  total_cost DECIMAL(12,4),
  
  -- Métadonnées
  is_active BOOLEAN DEFAULT true,
  is_template BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Composants d'un assemblage
CREATE TABLE IF NOT EXISTS assembly_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assembly_id UUID REFERENCES material_assemblies(id) ON DELETE CASCADE,
  material_id UUID REFERENCES materials(id),
  quantity DECIMAL(10,4) NOT NULL DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_assembly_items_assembly ON assembly_items(assembly_id);

-- ============================================================
-- LIEN TAKEOFF → MATÉRIAUX (Option B)
-- ============================================================
CREATE TABLE IF NOT EXISTS takeoff_material_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Lien vers takeoff
  takeoff_id UUID,
  measurement_id UUID,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Lien vers matériau ou assemblage
  material_id UUID REFERENCES materials(id),
  assembly_id UUID REFERENCES material_assemblies(id),
  
  -- Quantités
  measured_quantity DECIMAL(12,4), -- Quantité du takeoff
  adjusted_quantity DECIMAL(12,4), -- Avec facteur de perte
  unit VARCHAR(20),
  
  -- Prix calculés
  unit_price DECIMAL(12,4),
  total_price DECIMAL(12,4),
  labor_hours DECIMAL(8,2),
  labor_cost DECIMAL(12,4),
  
  -- Métadonnées
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_takeoff_links_project ON takeoff_material_links(project_id);
CREATE INDEX IF NOT EXISTS idx_takeoff_links_material ON takeoff_material_links(material_id);

-- ============================================================
-- TEMPLATES SOUMISSION (Option C)
-- ============================================================
CREATE TABLE IF NOT EXISTS soumission_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Contenu du template
  header_html TEXT,
  footer_html TEXT,
  terms_conditions TEXT,
  notes_default TEXT,
  
  -- Style
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#0d9488',
  font_family VARCHAR(50) DEFAULT 'Inter',
  
  -- Options
  show_unit_prices BOOLEAN DEFAULT true,
  show_quantities BOOLEAN DEFAULT true,
  show_labor_separately BOOLEAN DEFAULT false,
  include_taxes BOOLEAN DEFAULT true,
  
  -- Taxes Québec
  tps_rate DECIMAL(5,4) DEFAULT 0.05,
  tvq_rate DECIMAL(5,4) DEFAULT 0.09975,
  
  -- Validité
  validity_days INTEGER DEFAULT 30,
  
  -- Status
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- ============================================================
-- SOUMISSIONS AMÉLIORÉES
-- ============================================================
CREATE TABLE IF NOT EXISTS soumissions_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Références
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  client_id UUID,
  template_id UUID REFERENCES soumission_templates(id),
  
  -- Identification
  numero VARCHAR(50) UNIQUE NOT NULL,
  revision INTEGER DEFAULT 1,
  status VARCHAR(20) DEFAULT 'draft', -- draft, sent, viewed, accepted, rejected, expired
  
  -- Dates
  date_creation DATE DEFAULT CURRENT_DATE,
  date_envoi DATE,
  date_validite DATE,
  date_reponse DATE,
  
  -- Client info (snapshot)
  client_name VARCHAR(200),
  client_email VARCHAR(200),
  client_phone VARCHAR(20),
  client_address TEXT,
  
  -- Projet info
  project_name VARCHAR(200),
  project_address TEXT,
  project_description TEXT,
  
  -- Sections de la soumission
  sections JSONB DEFAULT '[]',
  
  -- Totaux
  subtotal_materials DECIMAL(12,2) DEFAULT 0,
  subtotal_labor DECIMAL(12,2) DEFAULT 0,
  subtotal_equipment DECIMAL(12,2) DEFAULT 0,
  subtotal_subcontracts DECIMAL(12,2) DEFAULT 0,
  subtotal DECIMAL(12,2) DEFAULT 0,
  
  -- Ajustements
  discount_percent DECIMAL(5,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  contingency_percent DECIMAL(5,2) DEFAULT 0,
  contingency_amount DECIMAL(12,2) DEFAULT 0,
  profit_percent DECIMAL(5,2) DEFAULT 0,
  profit_amount DECIMAL(12,2) DEFAULT 0,
  
  -- Taxes
  tps_amount DECIMAL(12,2) DEFAULT 0,
  tvq_amount DECIMAL(12,2) DEFAULT 0,
  
  -- Grand total
  grand_total DECIMAL(12,2) DEFAULT 0,
  
  -- Termes et notes
  terms_conditions TEXT,
  notes TEXT,
  internal_notes TEXT,
  
  -- Signatures
  prepared_by VARCHAR(100),
  prepared_by_title VARCHAR(100),
  signature_entreprise TEXT,
  signature_client TEXT,
  date_signature_client DATE,
  
  -- PDF
  pdf_url TEXT,
  pdf_generated_at TIMESTAMPTZ,
  
  -- Tracking
  viewed_at TIMESTAMPTZ,
  viewed_count INTEGER DEFAULT 0,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_soumissions_v2_project ON soumissions_v2(project_id);
CREATE INDEX IF NOT EXISTS idx_soumissions_v2_status ON soumissions_v2(status);
CREATE INDEX IF NOT EXISTS idx_soumissions_v2_numero ON soumissions_v2(numero);

-- Items de soumission
CREATE TABLE IF NOT EXISTS soumission_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  soumission_id UUID REFERENCES soumissions_v2(id) ON DELETE CASCADE,
  
  -- Section
  section_name VARCHAR(100),
  section_order INTEGER DEFAULT 0,
  
  -- Item
  item_order INTEGER DEFAULT 0,
  description TEXT NOT NULL,
  quantity DECIMAL(12,4),
  unit VARCHAR(20),
  
  -- Prix
  unit_price DECIMAL(12,4),
  total_price DECIMAL(12,4),
  
  -- Lien matériau
  material_id UUID REFERENCES materials(id),
  assembly_id UUID REFERENCES material_assemblies(id),
  takeoff_link_id UUID REFERENCES takeoff_material_links(id),
  
  -- Options
  is_optional BOOLEAN DEFAULT false,
  is_included BOOLEAN DEFAULT true,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_soumission_items_soumission ON soumission_items(soumission_id);

-- ============================================================
-- DONNÉES INITIALES - Catégories CSC MasterFormat
-- ============================================================
INSERT INTO material_categories (division_code, division_name, subdivision_code, subdivision_name, icon, sort_order) VALUES
-- Division 03 - Béton
('03', 'Béton', '03 10 00', 'Coffrage pour béton', 'square', 301),
('03', 'Béton', '03 20 00', 'Armature pour béton', 'grid', 302),
('03', 'Béton', '03 30 00', 'Béton coulé en place', 'box', 303),
('03', 'Béton', '03 40 00', 'Béton préfabriqué', 'package', 304),

-- Division 04 - Maçonnerie
('04', 'Maçonnerie', '04 20 00', 'Maçonnerie en unités', 'brick-wall', 401),
('04', 'Maçonnerie', '04 40 00', 'Pierre', 'mountain', 402),

-- Division 05 - Métaux
('05', 'Métaux', '05 10 00', 'Charpente métallique', 'columns', 501),
('05', 'Métaux', '05 20 00', 'Poutrelles en acier', 'minus', 502),
('05', 'Métaux', '05 50 00', 'Ouvrages métalliques', 'fence', 503),

-- Division 06 - Bois et plastiques
('06', 'Bois et plastiques', '06 10 00', 'Charpente en bois brut', 'tree-pine', 601),
('06', 'Bois et plastiques', '06 11 00', 'Ossature en bois', 'layout', 602),
('06', 'Bois et plastiques', '06 20 00', 'Menuiserie de finition', 'door-open', 603),
('06', 'Bois et plastiques', '06 40 00', 'Ébénisterie architecturale', 'archive', 604),

-- Division 07 - Isolation et étanchéité
('07', 'Isolation et étanchéité', '07 10 00', 'Étanchéité', 'shield', 701),
('07', 'Isolation et étanchéité', '07 20 00', 'Isolation thermique', 'thermometer', 702),
('07', 'Isolation et étanchéité', '07 30 00', 'Couvertures en bardeaux', 'home', 703),
('07', 'Isolation et étanchéité', '07 40 00', 'Parements métalliques', 'layout-panel-left', 704),
('07', 'Isolation et étanchéité', '07 50 00', 'Membranes de toiture', 'layers', 705),
('07', 'Isolation et étanchéité', '07 90 00', 'Coupe-feu et joints', 'flame', 706),

-- Division 08 - Portes et fenêtres
('08', 'Portes et fenêtres', '08 10 00', 'Portes et cadres métalliques', 'door-closed', 801),
('08', 'Portes et fenêtres', '08 14 00', 'Portes en bois', 'door-open', 802),
('08', 'Portes et fenêtres', '08 30 00', 'Portes spéciales', 'scan', 803),
('08', 'Portes et fenêtres', '08 50 00', 'Fenêtres', 'app-window', 804),
('08', 'Portes et fenêtres', '08 80 00', 'Vitrerie', 'square', 805),

-- Division 09 - Finitions
('09', 'Finitions', '09 20 00', 'Plâtrage et gypse', 'paintbrush', 901),
('09', 'Finitions', '09 30 00', 'Carrelage', 'grid-3x3', 902),
('09', 'Finitions', '09 50 00', 'Plafonds', 'layout-template', 903),
('09', 'Finitions', '09 60 00', 'Revêtements de sol souples', 'rectangle-horizontal', 904),
('09', 'Finitions', '09 64 00', 'Revêtements de sol en bois', 'tree-deciduous', 905),
('09', 'Finitions', '09 90 00', 'Peinture et revêtements', 'paint-bucket', 906),

-- Division 10 - Spécialités
('10', 'Spécialités', '10 10 00', 'Tableaux et accessoires', 'presentation', 1001),
('10', 'Spécialités', '10 20 00', 'Grilles et écrans', 'grid', 1002),
('10', 'Spécialités', '10 40 00', 'Signalisation', 'signpost', 1003),
('10', 'Spécialités', '10 50 00', 'Casiers', 'archive', 1004),

-- Division 22 - Plomberie
('22', 'Plomberie', '22 10 00', 'Tuyauterie plomberie', 'pipette', 2201),
('22', 'Plomberie', '22 40 00', 'Appareils sanitaires', 'bath', 2202),

-- Division 23 - CVCA
('23', 'CVCA', '23 05 00', 'Mécanique de base', 'settings', 2301),
('23', 'CVCA', '23 30 00', 'Conduits CVCA', 'wind', 2302),
('23', 'CVCA', '23 80 00', 'Équipements CVCA', 'air-vent', 2303),

-- Division 26 - Électricité
('26', 'Électricité', '26 05 00', 'Câblage électrique', 'cable', 2601),
('26', 'Électricité', '26 20 00', 'Distribution basse tension', 'zap', 2602),
('26', 'Électricité', '26 50 00', 'Éclairage', 'lightbulb', 2603),

-- Division 31 - Terrassement
('31', 'Terrassement', '31 10 00', 'Défrichage', 'trees', 3101),
('31', 'Terrassement', '31 20 00', 'Terrassement', 'mountain', 3102),
('31', 'Terrassement', '31 60 00', 'Fondations spéciales', 'building', 3103),

-- Division 32 - Aménagement extérieur
('32', 'Aménagement extérieur', '32 10 00', 'Bases et revêtements', 'road', 3201),
('32', 'Aménagement extérieur', '32 30 00', 'Clôtures et portails', 'fence', 3202),
('32', 'Aménagement extérieur', '32 90 00', 'Aménagement paysager', 'flower-2', 3203)

ON CONFLICT DO NOTHING;

-- ============================================================
-- DONNÉES INITIALES - Matériaux communs Québec
-- ============================================================
INSERT INTO materials (code, name, unit, unit_fr, unit_price, price_type, category_id, waste_factor, supplier, tags) 
SELECT 
  code, name, unit, unit_fr, unit_price, price_type,
  (SELECT id FROM material_categories WHERE subdivision_code = cat_code LIMIT 1),
  waste_factor, supplier, tags
FROM (VALUES
  -- BÉTON
  ('BET-001', 'Béton 25 MPa livré', 'm³', 'mètre cube', 245.00, 'material', '03 30 00', 5, 'Béton Provincial', ARRAY['béton', 'fondation', 'dalle']),
  ('BET-002', 'Béton 30 MPa livré', 'm³', 'mètre cube', 265.00, 'material', '03 30 00', 5, 'Béton Provincial', ARRAY['béton', 'structural']),
  ('BET-003', 'Béton 32 MPa auto-plaçant', 'm³', 'mètre cube', 295.00, 'material', '03 30 00', 3, 'Béton Provincial', ARRAY['béton', 'scc', 'autoplaçant']),
  ('BET-004', 'Pompage béton', 'm³', 'mètre cube', 45.00, 'equipment', '03 30 00', 0, NULL, ARRAY['pompage', 'béton']),
  
  -- COFFRAGE
  ('COF-001', 'Coffrage mur fondation', 'pi²', 'pied carré', 8.50, 'material', '03 10 00', 10, 'Location Simplex', ARRAY['coffrage', 'fondation']),
  ('COF-002', 'Coffrage dalle', 'pi²', 'pied carré', 6.75, 'material', '03 10 00', 10, 'Location Simplex', ARRAY['coffrage', 'dalle']),
  ('COF-003', 'Coffrage colonne', 'pi.lin', 'pied linéaire', 18.00, 'material', '03 10 00', 5, 'Location Simplex', ARRAY['coffrage', 'colonne']),
  
  -- ARMATURE
  ('ARM-001', 'Armature 10M', 'kg', 'kilogramme', 2.85, 'material', '03 20 00', 5, 'AcierPlus', ARRAY['armature', 'acier', 'rebar']),
  ('ARM-002', 'Armature 15M', 'kg', 'kilogramme', 2.75, 'material', '03 20 00', 5, 'AcierPlus', ARRAY['armature', 'acier', 'rebar']),
  ('ARM-003', 'Armature 20M', 'kg', 'kilogramme', 2.65, 'material', '03 20 00', 5, 'AcierPlus', ARRAY['armature', 'acier', 'rebar']),
  ('ARM-004', 'Treillis soudé 152x152 MW25.8', 'feuille', 'feuille', 125.00, 'material', '03 20 00', 3, 'AcierPlus', ARRAY['treillis', 'mesh', 'armature']),
  
  -- BOIS CHARPENTE
  ('BOI-001', '2x4x8 SPF #2', 'pce', 'pièce', 4.89, 'material', '06 11 00', 5, 'BMR', ARRAY['bois', '2x4', 'charpente']),
  ('BOI-002', '2x4x10 SPF #2', 'pce', 'pièce', 6.49, 'material', '06 11 00', 5, 'BMR', ARRAY['bois', '2x4', 'charpente']),
  ('BOI-003', '2x6x8 SPF #2', 'pce', 'pièce', 7.29, 'material', '06 11 00', 5, 'BMR', ARRAY['bois', '2x6', 'charpente']),
  ('BOI-004', '2x6x10 SPF #2', 'pce', 'pièce', 9.49, 'material', '06 11 00', 5, 'BMR', ARRAY['bois', '2x6', 'charpente']),
  ('BOI-005', '2x6x12 SPF #2', 'pce', 'pièce', 11.29, 'material', '06 11 00', 5, 'BMR', ARRAY['bois', '2x6', 'charpente']),
  ('BOI-006', '2x8x10 SPF #2', 'pce', 'pièce', 12.99, 'material', '06 11 00', 5, 'BMR', ARRAY['bois', '2x8', 'charpente']),
  ('BOI-007', '2x8x12 SPF #2', 'pce', 'pièce', 15.49, 'material', '06 11 00', 5, 'BMR', ARRAY['bois', '2x8', 'charpente']),
  ('BOI-008', '2x10x12 SPF #2', 'pce', 'pièce', 21.99, 'material', '06 11 00', 5, 'BMR', ARRAY['bois', '2x10', 'charpente']),
  ('BOI-009', '2x12x12 SPF #2', 'pce', 'pièce', 28.99, 'material', '06 11 00', 5, 'BMR', ARRAY['bois', '2x12', 'charpente']),
  
  -- PANNEAUX
  ('PAN-001', 'Contreplaqué 4x8 1/2"', 'feuille', 'feuille', 42.99, 'material', '06 11 00', 5, 'BMR', ARRAY['contreplaqué', 'plywood', 'panneau']),
  ('PAN-002', 'Contreplaqué 4x8 5/8"', 'feuille', 'feuille', 52.99, 'material', '06 11 00', 5, 'BMR', ARRAY['contreplaqué', 'plywood', 'panneau']),
  ('PAN-003', 'Contreplaqué 4x8 3/4"', 'feuille', 'feuille', 62.99, 'material', '06 11 00', 5, 'BMR', ARRAY['contreplaqué', 'plywood', 'panneau']),
  ('PAN-004', 'OSB 4x8 7/16"', 'feuille', 'feuille', 24.99, 'material', '06 11 00', 5, 'BMR', ARRAY['osb', 'panneau', 'revêtement']),
  ('PAN-005', 'OSB 4x8 1/2"', 'feuille', 'feuille', 28.99, 'material', '06 11 00', 5, 'BMR', ARRAY['osb', 'panneau', 'revêtement']),
  
  -- ISOLATION
  ('ISO-001', 'Isolant R-12 15" (laine)', 'pi²', 'pied carré', 0.89, 'material', '07 20 00', 5, 'Rona', ARRAY['isolant', 'laine', 'r12']),
  ('ISO-002', 'Isolant R-20 15" (laine)', 'pi²', 'pied carré', 1.29, 'material', '07 20 00', 5, 'Rona', ARRAY['isolant', 'laine', 'r20']),
  ('ISO-003', 'Isolant R-24 23" (laine)', 'pi²', 'pied carré', 1.49, 'material', '07 20 00', 5, 'Rona', ARRAY['isolant', 'laine', 'r24']),
  ('ISO-004', 'Polyiso 2" R-13', 'feuille', 'feuille 4x8', 38.99, 'material', '07 20 00', 3, 'Rona', ARRAY['isolant', 'polyiso', 'rigide']),
  ('ISO-005', 'PSE 2" Type 2', 'feuille', 'feuille 4x8', 18.99, 'material', '07 20 00', 3, 'Rona', ARRAY['isolant', 'styromousse', 'pse']),
  ('ISO-006', 'XPS 2" R-10', 'feuille', 'feuille 4x8', 32.99, 'material', '07 20 00', 3, 'Rona', ARRAY['isolant', 'xps', 'styrofoam']),
  
  -- GYPSE
  ('GYP-001', 'Gypse 4x8 1/2" régulier', 'feuille', 'feuille', 14.99, 'material', '09 20 00', 5, 'CGC', ARRAY['gypse', 'drywall', 'panneau']),
  ('GYP-002', 'Gypse 4x8 5/8" type X', 'feuille', 'feuille', 18.99, 'material', '09 20 00', 5, 'CGC', ARRAY['gypse', 'drywall', 'coupe-feu']),
  ('GYP-003', 'Gypse 4x8 1/2" résistant humidité', 'feuille', 'feuille', 19.99, 'material', '09 20 00', 5, 'CGC', ARRAY['gypse', 'greenboard', 'humidité']),
  ('GYP-004', 'Gypse 4x10 1/2" régulier', 'feuille', 'feuille', 18.99, 'material', '09 20 00', 5, 'CGC', ARRAY['gypse', 'drywall', 'panneau']),
  ('GYP-005', 'Composé à joints (seau 23kg)', 'seau', 'seau', 24.99, 'material', '09 20 00', 0, 'CGC', ARRAY['composé', 'joint', 'finition']),
  ('GYP-006', 'Ruban papier joints (150m)', 'roul', 'rouleau', 8.99, 'material', '09 20 00', 0, 'CGC', ARRAY['ruban', 'joint', 'finition']),
  
  -- PEINTURE
  ('PEI-001', 'Apprêt latex intérieur', 'gal', 'gallon', 39.99, 'material', '09 90 00', 10, 'Benjamin Moore', ARRAY['peinture', 'apprêt', 'primer']),
  ('PEI-002', 'Peinture latex fini mat', 'gal', 'gallon', 54.99, 'material', '09 90 00', 10, 'Benjamin Moore', ARRAY['peinture', 'latex', 'mat']),
  ('PEI-003', 'Peinture latex fini perle', 'gal', 'gallon', 59.99, 'material', '09 90 00', 10, 'Benjamin Moore', ARRAY['peinture', 'latex', 'perle']),
  ('PEI-004', 'Peinture latex fini semi-lustré', 'gal', 'gallon', 64.99, 'material', '09 90 00', 10, 'Benjamin Moore', ARRAY['peinture', 'latex', 'semi-lustré']),
  
  -- TOITURE
  ('TOI-001', 'Bardeaux asphalte (paquet)', 'pqt', 'paquet', 32.99, 'material', '07 30 00', 5, 'BP', ARRAY['bardeau', 'toiture', 'asphalte']),
  ('TOI-002', 'Membrane EPDM 60 mil', 'pi²', 'pied carré', 2.89, 'material', '07 50 00', 5, 'Firestone', ARRAY['membrane', 'epdm', 'toiture']),
  ('TOI-003', 'Membrane TPO 60 mil', 'pi²', 'pied carré', 3.29, 'material', '07 50 00', 5, 'Carlisle', ARRAY['membrane', 'tpo', 'toiture']),
  ('TOI-004', 'Papier feutre #15', 'roul', 'rouleau', 28.99, 'material', '07 30 00', 5, NULL, ARRAY['feutre', 'sous-couche', 'toiture']),
  ('TOI-005', 'Membrane autocollante', 'roul', 'rouleau', 89.99, 'material', '07 10 00', 3, 'Grace', ARRAY['membrane', 'ice-water', 'étanchéité']),
  
  -- ÉLECTRICITÉ
  ('ELE-001', 'Câble NMD90 14/2', 'm', 'mètre', 1.89, 'material', '26 05 00', 10, NULL, ARRAY['câble', 'fil', '14-2']),
  ('ELE-002', 'Câble NMD90 12/2', 'm', 'mètre', 2.49, 'material', '26 05 00', 10, NULL, ARRAY['câble', 'fil', '12-2']),
  ('ELE-003', 'Boîte électrique simple', 'pce', 'pièce', 2.49, 'material', '26 20 00', 5, NULL, ARRAY['boîte', 'électrique', 'simple']),
  ('ELE-004', 'Boîte électrique double', 'pce', 'pièce', 3.99, 'material', '26 20 00', 5, NULL, ARRAY['boîte', 'électrique', 'double']),
  ('ELE-005', 'Prise duplex 15A', 'pce', 'pièce', 2.99, 'material', '26 20 00', 0, NULL, ARRAY['prise', 'receptacle', '15a']),
  ('ELE-006', 'Interrupteur simple', 'pce', 'pièce', 3.49, 'material', '26 20 00', 0, NULL, ARRAY['interrupteur', 'switch', 'simple']),
  ('ELE-007', 'Panneau 100A 24 circuits', 'pce', 'pièce', 249.00, 'material', '26 20 00', 0, NULL, ARRAY['panneau', 'distribution', '100a']),
  
  -- PLOMBERIE
  ('PLO-001', 'Tuyau PEX 1/2" rouge', 'pi', 'pied', 1.29, 'material', '22 10 00', 5, NULL, ARRAY['pex', 'tuyau', 'plomberie']),
  ('PLO-002', 'Tuyau PEX 3/4" bleu', 'pi', 'pied', 1.89, 'material', '22 10 00', 5, NULL, ARRAY['pex', 'tuyau', 'plomberie']),
  ('PLO-003', 'Tuyau ABS 3"', 'pi', 'pied', 4.29, 'material', '22 10 00', 5, NULL, ARRAY['abs', 'drain', 'plomberie']),
  ('PLO-004', 'Toilette Toto Drake', 'pce', 'pièce', 349.00, 'material', '22 40 00', 0, 'Toto', ARRAY['toilette', 'wc', 'sanitaire']),
  ('PLO-005', 'Lavabo vanité 24"', 'pce', 'pièce', 149.00, 'material', '22 40 00', 0, NULL, ARRAY['lavabo', 'vanité', 'sanitaire']),
  ('PLO-006', 'Robinet cuisine', 'pce', 'pièce', 189.00, 'material', '22 40 00', 0, 'Moen', ARRAY['robinet', 'cuisine', 'faucet']),
  
  -- PORTES ET FENÊTRES
  ('POR-001', 'Porte intérieure 30" moulée', 'pce', 'pièce', 89.00, 'material', '08 14 00', 0, 'Masonite', ARRAY['porte', 'intérieure', 'moulée']),
  ('POR-002', 'Porte intérieure 32" moulée', 'pce', 'pièce', 95.00, 'material', '08 14 00', 0, 'Masonite', ARRAY['porte', 'intérieure', 'moulée']),
  ('POR-003', 'Porte acier extérieure 34"', 'pce', 'pièce', 349.00, 'material', '08 10 00', 0, 'Stanley', ARRAY['porte', 'extérieure', 'acier']),
  ('POR-004', 'Porte-patio 6'' vinyle', 'pce', 'pièce', 899.00, 'material', '08 50 00', 0, NULL, ARRAY['porte-patio', 'vinyle', 'fenêtre']),
  ('FEN-001', 'Fenêtre vinyle 36x48 coulissante', 'pce', 'pièce', 289.00, 'material', '08 50 00', 0, NULL, ARRAY['fenêtre', 'vinyle', 'coulissante']),
  ('FEN-002', 'Fenêtre vinyle 48x60 à battant', 'pce', 'pièce', 449.00, 'material', '08 50 00', 0, NULL, ARRAY['fenêtre', 'vinyle', 'battant']),
  
  -- MAIN D'OEUVRE CCQ (taux approximatifs)
  ('MO-CHAR', 'Charpentier-menuisier', 'hr', 'heure', 52.50, 'labor', '06 11 00', 0, 'CCQ', ARRAY['main-oeuvre', 'charpentier', 'ccq']),
  ('MO-ELEC', 'Électricien', 'hr', 'heure', 54.00, 'labor', '26 05 00', 0, 'CCQ', ARRAY['main-oeuvre', 'électricien', 'ccq']),
  ('MO-PLOM', 'Plombier', 'hr', 'heure', 55.50, 'labor', '22 10 00', 0, 'CCQ', ARRAY['main-oeuvre', 'plombier', 'ccq']),
  ('MO-PEIN', 'Peintre', 'hr', 'heure', 46.50, 'labor', '09 90 00', 0, 'CCQ', ARRAY['main-oeuvre', 'peintre', 'ccq']),
  ('MO-MACO', 'Maçon', 'hr', 'heure', 52.00, 'labor', '04 20 00', 0, 'CCQ', ARRAY['main-oeuvre', 'maçon', 'ccq']),
  ('MO-JOUR', 'Journalier', 'hr', 'heure', 38.50, 'labor', '31 20 00', 0, 'CCQ', ARRAY['main-oeuvre', 'journalier', 'ccq']),
  ('MO-FERR', 'Ferrailleur', 'hr', 'heure', 53.50, 'labor', '03 20 00', 0, 'CCQ', ARRAY['main-oeuvre', 'ferrailleur', 'ccq']),
  ('MO-COIF', 'Couvreur', 'hr', 'heure', 49.00, 'labor', '07 30 00', 0, 'CCQ', ARRAY['main-oeuvre', 'couvreur', 'ccq']),
  
  -- ÉQUIPEMENTS
  ('EQU-001', 'Excavatrice 320 (jour)', 'jour', 'jour', 850.00, 'equipment', '31 20 00', 0, 'Location', ARRAY['excavatrice', 'équipement', 'location']),
  ('EQU-002', 'Chargeuse sur roues (jour)', 'jour', 'jour', 650.00, 'equipment', '31 20 00', 0, 'Location', ARRAY['chargeuse', 'loader', 'équipement']),
  ('EQU-003', 'Nacelle 40'' (jour)', 'jour', 'jour', 275.00, 'equipment', '31 20 00', 0, 'Location', ARRAY['nacelle', 'lift', 'équipement']),
  ('EQU-004', 'Échafaudage (semaine)', 'sem', 'semaine', 450.00, 'equipment', '31 20 00', 0, 'Location', ARRAY['échafaudage', 'scaffold', 'équipement']),
  ('EQU-005', 'Compresseur 185 CFM (jour)', 'jour', 'jour', 175.00, 'equipment', '31 20 00', 0, 'Location', ARRAY['compresseur', 'air', 'équipement'])

) AS v(code, name, unit, unit_fr, unit_price, price_type, cat_code, waste_factor, supplier, tags)
ON CONFLICT (code) DO UPDATE SET
  unit_price = EXCLUDED.unit_price,
  updated_at = NOW();

-- ============================================================
-- TEMPLATE SOUMISSION PAR DÉFAUT
-- ============================================================
INSERT INTO soumission_templates (
  name, description, is_default, is_active,
  terms_conditions, validity_days,
  tps_rate, tvq_rate
) VALUES (
  'Template Standard Québec',
  'Template de soumission standard pour projets au Québec',
  true, true,
  E'CONDITIONS GÉNÉRALES:\n\n1. VALIDITÉ: Cette soumission est valide pour 30 jours.\n\n2. PAIEMENT: Dépôt de 25% à la signature, 25% à mi-travaux, solde à la fin des travaux.\n\n3. MODIFICATIONS: Tout travail supplémentaire sera facturé selon les taux en vigueur après approbation écrite.\n\n4. GARANTIE: Les travaux sont garantis pour une période de 1 an suivant la date de fin des travaux.\n\n5. ASSURANCES: L''entrepreneur détient une assurance responsabilité civile de 2 000 000 $.\n\n6. LICENCE RBQ: L''entrepreneur est titulaire d''une licence RBQ valide.\n\n7. DÉLAIS: Les délais mentionnés sont approximatifs et peuvent varier selon les conditions.\n\n8. PERMIS: Les permis nécessaires sont la responsabilité du client, sauf indication contraire.',
  30,
  0.05,
  0.09975
) ON CONFLICT DO NOTHING;

-- ============================================================
-- FONCTIONS UTILITAIRES
-- ============================================================

-- Fonction pour calculer le prix avec perte
CREATE OR REPLACE FUNCTION calculate_material_cost(
  p_material_id UUID,
  p_quantity DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
  v_unit_price DECIMAL;
  v_waste_factor DECIMAL;
BEGIN
  SELECT unit_price, COALESCE(waste_factor, 0) 
  INTO v_unit_price, v_waste_factor
  FROM materials WHERE id = p_material_id;
  
  IF v_unit_price IS NULL THEN
    RETURN 0;
  END IF;
  
  RETURN p_quantity * v_unit_price * (1 + v_waste_factor / 100);
END;
$$ LANGUAGE plpgsql;

-- Fonction pour générer numéro de soumission
CREATE OR REPLACE FUNCTION generate_soumission_number() 
RETURNS VARCHAR AS $$
DECLARE
  v_year VARCHAR(4);
  v_seq INTEGER;
  v_number VARCHAR(50);
BEGIN
  v_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(numero FROM 6 FOR 4) AS INTEGER)), 0) + 1
  INTO v_seq
  FROM soumissions_v2
  WHERE numero LIKE 'SOU-' || v_year || '%';
  
  v_number := 'SOU-' || v_year || '-' || LPAD(v_seq::TEXT, 4, '0');
  
  RETURN v_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- POLICIES RLS
-- ============================================================
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_assemblies ENABLE ROW LEVEL SECURITY;
ALTER TABLE soumission_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE soumissions_v2 ENABLE ROW LEVEL SECURITY;

-- Lecture pour tous les utilisateurs authentifiés
CREATE POLICY "Materials visible to authenticated users"
  ON materials FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Categories visible to authenticated users"
  ON material_categories FOR SELECT
  TO authenticated
  USING (true);

-- Modification pour admins (à adapter selon vos besoins)
CREATE POLICY "Materials modifiable by authenticated users"
  ON materials FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Assemblies modifiable by authenticated users"
  ON material_assemblies FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Templates visible to authenticated users"
  ON soumission_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Soumissions modifiable by authenticated users"
  ON soumissions_v2 FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION update_material_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER materials_updated_at
  BEFORE UPDATE ON materials
  FOR EACH ROW
  EXECUTE FUNCTION update_material_timestamp();

CREATE TRIGGER soumissions_v2_updated_at
  BEFORE UPDATE ON soumissions_v2
  FOR EACH ROW
  EXECUTE FUNCTION update_material_timestamp();

-- Log historique des prix
CREATE OR REPLACE FUNCTION log_price_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.unit_price IS DISTINCT FROM NEW.unit_price THEN
    INSERT INTO material_price_history (material_id, unit_price, price_date, price_source)
    VALUES (NEW.id, OLD.unit_price, OLD.price_date, 'historical');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER materials_price_history
  BEFORE UPDATE ON materials
  FOR EACH ROW
  EXECUTE FUNCTION log_price_change();

COMMIT;
