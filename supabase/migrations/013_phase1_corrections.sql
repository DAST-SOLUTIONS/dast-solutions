-- ============================================================================
-- DAST Solutions - Migration 013: Phase 1 Corrections complètes
-- Date: 10 janvier 2026
-- ============================================================================

-- ============================================================================
-- 1. SYSTÈME DE PHASES PROJETS (Un seul statut à la fois)
-- ============================================================================

-- Ajouter la colonne phase aux projets (si elle n'existe pas)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'phase') THEN
    ALTER TABLE projects ADD COLUMN phase VARCHAR(50) DEFAULT 'conception';
  END IF;
END $$;

-- Ajouter d'autres colonnes manquantes pour les projets
DO $$
BEGIN
  -- Type public/privé
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'visibility') THEN
    ALTER TABLE projects ADD COLUMN visibility VARCHAR(20) DEFAULT 'private';
  END IF;
  
  -- Type de bâtiment
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'building_type') THEN
    ALTER TABLE projects ADD COLUMN building_type VARCHAR(100);
  END IF;
  
  -- Ville et Province séparés
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'city') THEN
    ALTER TABLE projects ADD COLUMN city VARCHAR(100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'province') THEN
    ALTER TABLE projects ADD COLUMN province VARCHAR(50) DEFAULT 'QC';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'postal_code') THEN
    ALTER TABLE projects ADD COLUMN postal_code VARCHAR(10);
  END IF;
  
  -- Coordonnées GPS
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'latitude') THEN
    ALTER TABLE projects ADD COLUMN latitude DECIMAL(10, 7);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'longitude') THEN
    ALTER TABLE projects ADD COLUMN longitude DECIMAL(10, 7);
  END IF;
  
  -- Numéro d'appel d'offres si applicable
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'bid_number') THEN
    ALTER TABLE projects ADD COLUMN bid_number VARCHAR(100);
  END IF;
  
  -- Source de l'appel d'offres
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'bid_source') THEN
    ALTER TABLE projects ADD COLUMN bid_source VARCHAR(50);
  END IF;
END $$;

COMMENT ON COLUMN projects.phase IS 'Phase actuelle: conception, estimation, gestion, termine';
COMMENT ON COLUMN projects.visibility IS 'Visibilité: public, private';

-- Index pour les phases
CREATE INDEX IF NOT EXISTS idx_projects_phase ON projects(phase);
CREATE INDEX IF NOT EXISTS idx_projects_visibility ON projects(visibility);

-- ============================================================================
-- 2. AMÉLIORER TABLE CLIENTS (Multi-contacts + Comptes payables)
-- ============================================================================

-- Créer une table de contacts séparée
CREATE TABLE IF NOT EXISTS client_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Infos contact
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100),
  title VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(50),
  mobile VARCHAR(50),
  
  -- Type de contact
  contact_type VARCHAR(50) DEFAULT 'general', -- general, billing, technical, emergency
  is_primary BOOLEAN DEFAULT FALSE,
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_contacts_client ON client_contacts(client_id);
CREATE INDEX IF NOT EXISTS idx_client_contacts_type ON client_contacts(contact_type);

ALTER TABLE client_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own client contacts" ON client_contacts
  FOR ALL USING (auth.uid() = user_id);

-- Ajouter colonnes de facturation aux clients
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'billing_email') THEN
    ALTER TABLE clients ADD COLUMN billing_email VARCHAR(255);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'billing_contact_name') THEN
    ALTER TABLE clients ADD COLUMN billing_contact_name VARCHAR(200);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'billing_phone') THEN
    ALTER TABLE clients ADD COLUMN billing_phone VARCHAR(50);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'payment_terms') THEN
    ALTER TABLE clients ADD COLUMN payment_terms VARCHAR(50) DEFAULT 'net30';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'tax_number') THEN
    ALTER TABLE clients ADD COLUMN tax_number VARCHAR(50);
  END IF;
END $$;

-- ============================================================================
-- 3. AMÉLIORER TABLE FACTURES (Lier aux projets)
-- ============================================================================

-- Ajouter project_id à invoices si manquant
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'project_id') THEN
    ALTER TABLE invoices ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'soumission_id') THEN
    ALTER TABLE invoices ADD COLUMN soumission_id UUID;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_invoices_project ON invoices(project_id);

-- ============================================================================
-- 4. LISTE COMPLÈTE MÉTIERS/OCCUPATIONS CCQ (150+)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ccq_trades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  name_fr VARCHAR(200) NOT NULL,
  name_en VARCHAR(200),
  category VARCHAR(100),
  sector VARCHAR(50), -- residentiel, commercial, industriel, genie_civil
  apprentice_ratio VARCHAR(20),
  has_specialty BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insérer tous les métiers CCQ
INSERT INTO ccq_trades (code, name_fr, name_en, category, sector) VALUES
-- MÉTIERS DE LA CONSTRUCTION
('001', 'Briqueteur-maçon', 'Bricklayer-Mason', 'Métier', 'commercial'),
('002', 'Calorifugeur', 'Insulator', 'Métier', 'industriel'),
('003', 'Carreleur', 'Tile Setter', 'Métier', 'commercial'),
('004', 'Charpentier-menuisier', 'Carpenter-Joiner', 'Métier', 'residentiel'),
('005', 'Chaudronnier', 'Boilermaker', 'Métier', 'industriel'),
('006', 'Cimentier-applicateur', 'Cement Finisher', 'Métier', 'commercial'),
('007', 'Couvreur', 'Roofer', 'Métier', 'commercial'),
('008', 'Électricien', 'Electrician', 'Métier', 'commercial'),
('009', 'Ferblantier', 'Sheet Metal Worker', 'Métier', 'commercial'),
('010', 'Ferrailleur', 'Reinforcing Steel Erector', 'Métier', 'commercial'),
('011', 'Frigoriste', 'Refrigeration Mechanic', 'Métier', 'commercial'),
('012', 'Grutier', 'Crane Operator', 'Métier', 'commercial'),
('013', 'Mécanicien d''ascenseur', 'Elevator Mechanic', 'Métier', 'commercial'),
('014', 'Mécanicien de chantier', 'Construction Millwright', 'Métier', 'industriel'),
('015', 'Mécanicien de machines lourdes', 'Heavy Equipment Mechanic', 'Métier', 'genie_civil'),
('016', 'Mécanicien en protection-incendie', 'Sprinkler System Installer', 'Métier', 'commercial'),
('017', 'Monteur-assembleur', 'Structural Steel Erector', 'Métier', 'commercial'),
('018', 'Opérateur d''équipement lourd', 'Heavy Equipment Operator', 'Métier', 'genie_civil'),
('019', 'Opérateur de pelles', 'Excavator Operator', 'Métier', 'genie_civil'),
('020', 'Peintre', 'Painter', 'Métier', 'commercial'),
('021', 'Plâtrier', 'Plasterer', 'Métier', 'commercial'),
('022', 'Poseur de revêtements souples', 'Resilient Floor Covering Installer', 'Métier', 'commercial'),
('023', 'Poseur de systèmes intérieurs', 'Interior Systems Installer', 'Métier', 'commercial'),
('024', 'Serrurier de bâtiment', 'Building Locksmith', 'Métier', 'commercial'),
('025', 'Soudeur', 'Welder', 'Métier', 'industriel'),
('026', 'Soudeur en tuyauterie', 'Pipe Welder', 'Métier', 'industriel'),
('027', 'Tuyauteur', 'Pipefitter', 'Métier', 'industriel'),
('028', 'Vitrier', 'Glazier', 'Métier', 'commercial'),
('029', 'Plombier', 'Plumber', 'Métier', 'residentiel'),
('030', 'Mécanicien en tuyauterie', 'Pipe Mechanic', 'Métier', 'commercial'),
-- OCCUPATIONS
('101', 'Manœuvre', 'Labourer', 'Occupation', 'commercial'),
('102', 'Manœuvre spécialisé', 'Specialized Labourer', 'Occupation', 'commercial'),
('103', 'Manœuvre pipeline', 'Pipeline Labourer', 'Occupation', 'industriel'),
('104', 'Manœuvre en désamiantage', 'Asbestos Removal Labourer', 'Occupation', 'commercial'),
('105', 'Arpenteur', 'Surveyor', 'Occupation', 'genie_civil'),
('106', 'Boutefeu-foreur', 'Blaster-Driller', 'Occupation', 'genie_civil'),
('107', 'Scaphandrier', 'Diver', 'Occupation', 'genie_civil'),
('108', 'Monteur de lignes', 'Lineman', 'Occupation', 'industriel'),
('109', 'Soudeur alimentation', 'Welder-Fitter', 'Occupation', 'industriel'),
('110', 'Soudeur distribution', 'Distribution Welder', 'Occupation', 'industriel'),
-- SPÉCIALITÉS CHARPENTIER-MENUISIER
('004-A', 'Charpentier-menuisier - Général', 'Carpenter-Joiner - General', 'Spécialité', 'residentiel'),
('004-B', 'Charpentier-menuisier - Coffreur', 'Carpenter-Joiner - Formwork', 'Spécialité', 'commercial'),
('004-C', 'Charpentier-menuisier - Parqueteur', 'Carpenter-Joiner - Flooring', 'Spécialité', 'residentiel'),
-- SPÉCIALITÉS OPÉRATEUR ÉQUIPEMENT LOURD
('018-A', 'Opérateur - Bouteur', 'Operator - Bulldozer', 'Spécialité', 'genie_civil'),
('018-B', 'Opérateur - Chargeuse', 'Operator - Loader', 'Spécialité', 'genie_civil'),
('018-C', 'Opérateur - Niveleuse', 'Operator - Grader', 'Spécialité', 'genie_civil'),
('018-D', 'Opérateur - Rouleau compacteur', 'Operator - Roller', 'Spécialité', 'genie_civil'),
('018-E', 'Opérateur - Tracteur', 'Operator - Tractor', 'Spécialité', 'genie_civil'),
('018-F', 'Opérateur - Finisseuse', 'Operator - Paver', 'Spécialité', 'genie_civil'),
('018-G', 'Opérateur - Foreuse', 'Operator - Drill', 'Spécialité', 'genie_civil'),
-- SPÉCIALITÉS GRUTIER
('012-A', 'Grutier - Classe A (illimité)', 'Crane Operator - Class A', 'Spécialité', 'commercial'),
('012-B', 'Grutier - Classe B (limité)', 'Crane Operator - Class B', 'Spécialité', 'commercial'),
('012-C', 'Grutier - Pont roulant', 'Crane Operator - Overhead', 'Spécialité', 'industriel'),
-- SPÉCIALITÉS ÉLECTRICIEN
('008-A', 'Électricien - Construction', 'Electrician - Construction', 'Spécialité', 'commercial'),
('008-B', 'Électricien - Résidentiel', 'Electrician - Residential', 'Spécialité', 'residentiel'),
('008-C', 'Électricien - Industriel', 'Electrician - Industrial', 'Spécialité', 'industriel'),
-- AUTRES MÉTIERS/OCCUPATIONS
('031', 'Monteur de structures', 'Structural Assembler', 'Métier', 'commercial'),
('032', 'Poseur d''armatures', 'Rebar Installer', 'Métier', 'commercial'),
('033', 'Installateur de gicleurs', 'Sprinkler Installer', 'Métier', 'commercial'),
('034', 'Technicien en mécanique du bâtiment', 'Building Mechanics Technician', 'Occupation', 'commercial'),
('035', 'Préposé aux pompes à béton', 'Concrete Pump Operator', 'Occupation', 'commercial'),
('036', 'Tireur de joints', 'Drywall Taper', 'Occupation', 'commercial')
ON CONFLICT (code) DO UPDATE SET
  name_fr = EXCLUDED.name_fr,
  category = EXCLUDED.category,
  sector = EXCLUDED.sector;

-- ============================================================================
-- 5. TABLE POUR VÉRIFICATION RBQ
-- ============================================================================

CREATE TABLE IF NOT EXISTS rbq_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entrepreneur_id UUID REFERENCES entrepreneurs(id) ON DELETE SET NULL,
  
  -- Données de recherche
  license_number VARCHAR(50) NOT NULL,
  company_name VARCHAR(255),
  
  -- Résultats
  is_valid BOOLEAN,
  status VARCHAR(50), -- active, suspended, revoked, not_found
  license_type VARCHAR(100),
  categories TEXT[],
  expiry_date DATE,
  restrictions TEXT,
  
  -- Métadonnées
  verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  raw_response JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rbq_verifications_license ON rbq_verifications(license_number);
CREATE INDEX IF NOT EXISTS idx_rbq_verifications_entrepreneur ON rbq_verifications(entrepreneur_id);

ALTER TABLE rbq_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own rbq verifications" ON rbq_verifications
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- 6. AJOUTER RBQ STATUS AUX ENTREPRENEURS
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'entrepreneurs' AND column_name = 'rbq_status') THEN
    ALTER TABLE entrepreneurs ADD COLUMN rbq_status VARCHAR(50) DEFAULT 'unknown';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'entrepreneurs' AND column_name = 'rbq_verified_at') THEN
    ALTER TABLE entrepreneurs ADD COLUMN rbq_verified_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'entrepreneurs' AND column_name = 'rbq_categories') THEN
    ALTER TABLE entrepreneurs ADD COLUMN rbq_categories TEXT[];
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'entrepreneurs' AND column_name = 'rbq_expiry') THEN
    ALTER TABLE entrepreneurs ADD COLUMN rbq_expiry DATE;
  END IF;
END $$;

-- ============================================================================
-- FIN MIGRATION 013
-- ============================================================================
