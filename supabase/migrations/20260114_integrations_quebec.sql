-- Migration: Tables intégrations Quebec/Canada
-- Date: 2026-01-14
-- Description: RBQ, Appels d'Offres (SEAO, MERX, BuyGC, Bonfire), Associations, CCQ amélioré

-- ============================================================
-- TABLE: RBQ Entrepreneurs
-- ============================================================
CREATE TABLE IF NOT EXISTS rbq_entrepreneurs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  neq VARCHAR(20), -- Numéro d'entreprise du Québec
  nom_entreprise VARCHAR(255) NOT NULL,
  nom_dirigeant VARCHAR(255),
  adresse TEXT,
  ville VARCHAR(100),
  region VARCHAR(100),
  code_postal VARCHAR(10),
  telephone VARCHAR(20),
  courriel VARCHAR(255),
  site_web VARCHAR(255),
  licence_numero VARCHAR(20) UNIQUE,
  licence JSONB, -- Détails licence (catégories, dates, etc.)
  infractions JSONB DEFAULT '[]',
  statut VARCHAR(20) DEFAULT 'actif' CHECK (statut IN ('actif', 'suspendu', 'revoque', 'expire')),
  date_verification TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rbq_licence ON rbq_entrepreneurs(licence_numero);
CREATE INDEX IF NOT EXISTS idx_rbq_nom ON rbq_entrepreneurs(nom_entreprise);
CREATE INDEX IF NOT EXISTS idx_rbq_ville ON rbq_entrepreneurs(ville);
CREATE INDEX IF NOT EXISTS idx_rbq_statut ON rbq_entrepreneurs(statut);

-- ============================================================
-- TABLE: SEAO Appels d'Offres
-- ============================================================
CREATE TABLE IF NOT EXISTS seao_appels_offres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_seao VARCHAR(50) UNIQUE NOT NULL,
  titre TEXT NOT NULL,
  organisme VARCHAR(255),
  organisme_type VARCHAR(100),
  type VARCHAR(50) DEFAULT 'construction',
  categorie VARCHAR(100),
  region VARCHAR(100),
  ville VARCHAR(100),
  date_publication DATE,
  date_ouverture DATE,
  date_fermeture DATE NOT NULL,
  estimation_min NUMERIC(15,2),
  estimation_max NUMERIC(15,2),
  estimation_budget NUMERIC(15,2),
  budget_affiche VARCHAR(100),
  description TEXT,
  documents JSONB DEFAULT '[]',
  exigences_rbq JSONB DEFAULT '[]',
  statut VARCHAR(20) DEFAULT 'ouvert' CHECK (statut IN ('ouvert', 'ferme', 'annule', 'attribue', 'prolonge')),
  url_seao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seao_numero ON seao_appels_offres(numero_seao);
CREATE INDEX IF NOT EXISTS idx_seao_statut ON seao_appels_offres(statut);
CREATE INDEX IF NOT EXISTS idx_seao_date_fermeture ON seao_appels_offres(date_fermeture);
CREATE INDEX IF NOT EXISTS idx_seao_region ON seao_appels_offres(region);

-- ============================================================
-- TABLE: SEAO Alertes
-- ============================================================
CREATE TABLE IF NOT EXISTS seao_alertes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  criteria JSONB NOT NULL,
  email VARCHAR(255) NOT NULL,
  active BOOLEAN DEFAULT true,
  derniere_notification TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seao_alertes_user ON seao_alertes(user_id);
CREATE INDEX IF NOT EXISTS idx_seao_alertes_active ON seao_alertes(active);

-- ============================================================
-- TABLE: Appels d'Offres Favoris (multi-sources)
-- ============================================================
CREATE TABLE IF NOT EXISTS appels_offres_favoris (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  appel_offre_id VARCHAR(100) NOT NULL,
  source VARCHAR(20) NOT NULL CHECK (source IN ('seao', 'merx', 'buygc', 'bonfire', 'autre')),
  notes TEXT,
  statut_suivi VARCHAR(50) DEFAULT 'interesse',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, appel_offre_id, source)
);

CREATE INDEX IF NOT EXISTS idx_favoris_user ON appels_offres_favoris(user_id);
CREATE INDEX IF NOT EXISTS idx_favoris_source ON appels_offres_favoris(source);

-- ============================================================
-- TABLE: Appels d'Offres Alertes (multi-sources)
-- ============================================================
CREATE TABLE IF NOT EXISTS appels_offres_alertes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  mots_cles JSONB DEFAULT '[]',
  categories JSONB DEFAULT '[]',
  regions JSONB DEFAULT '[]',
  sources JSONB DEFAULT '["seao", "merx", "buygc", "bonfire"]',
  montant_min NUMERIC(15,2),
  montant_max NUMERIC(15,2),
  frequence VARCHAR(20) DEFAULT 'quotidien' CHECK (frequence IN ('immediat', 'quotidien', 'hebdomadaire')),
  email VARCHAR(255) NOT NULL,
  active BOOLEAN DEFAULT true,
  derniere_execution TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ao_alertes_user ON appels_offres_alertes(user_id);
CREATE INDEX IF NOT EXISTS idx_ao_alertes_active ON appels_offres_alertes(active);

-- ============================================================
-- TABLE: CCQ Taux Horaires (amélioré)
-- ============================================================
CREATE TABLE IF NOT EXISTS ccq_taux_horaires (
  id VARCHAR(100) PRIMARY KEY,
  metier VARCHAR(100) NOT NULL,
  classification VARCHAR(50) DEFAULT 'compagnon',
  secteur VARCHAR(10) NOT NULL CHECK (secteur IN ('IC', 'CI', 'GC', 'RE')),
  taux_base NUMERIC(10,2) NOT NULL,
  vacances NUMERIC(10,2) DEFAULT 0,
  conges_feries NUMERIC(10,2) DEFAULT 0,
  avantages_sociaux NUMERIC(10,2) DEFAULT 0,
  fonds_formation NUMERIC(10,2) DEFAULT 0,
  regime_retraite NUMERIC(10,2) DEFAULT 0,
  assurance NUMERIC(10,2) DEFAULT 0,
  total_employeur NUMERIC(10,2) NOT NULL,
  date_vigueur DATE NOT NULL,
  date_fin DATE,
  convention_collective VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ccq_taux_metier ON ccq_taux_horaires(metier);
CREATE INDEX IF NOT EXISTS idx_ccq_taux_secteur ON ccq_taux_horaires(secteur);

-- ============================================================
-- TABLE: CCQ Travailleurs (pour vérification cartes)
-- ============================================================
CREATE TABLE IF NOT EXISTS ccq_travailleurs_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_ccq VARCHAR(20) UNIQUE NOT NULL,
  nom VARCHAR(100),
  prenom VARCHAR(100),
  metier VARCHAR(100),
  classification VARCHAR(50),
  niveau_apprenti INTEGER,
  carte_competence JSONB,
  formations_sst JSONB DEFAULT '[]',
  heures_travaillees INTEGER,
  region_domicile VARCHAR(100),
  date_verification TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ccq_travailleur_numero ON ccq_travailleurs_cache(numero_ccq);

-- ============================================================
-- TABLE: Associations - Adhésions utilisateurs
-- ============================================================
CREATE TABLE IF NOT EXISTS user_associations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  association_id VARCHAR(50) NOT NULL,
  numero_membre VARCHAR(100),
  date_adhesion DATE,
  date_expiration DATE,
  certifications JSONB DEFAULT '[]',
  statut VARCHAR(20) DEFAULT 'actif',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, association_id)
);

CREATE INDEX IF NOT EXISTS idx_user_assoc_user ON user_associations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_assoc_assoc ON user_associations(association_id);

-- ============================================================
-- TABLE: Membres des associations (bottin)
-- ============================================================
CREATE TABLE IF NOT EXISTS association_membres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id VARCHAR(50) NOT NULL,
  entreprise_nom VARCHAR(255) NOT NULL,
  contact_nom VARCHAR(255),
  telephone VARCHAR(20),
  courriel VARCHAR(255),
  site_web VARCHAR(255),
  adresse TEXT,
  ville VARCHAR(100),
  code_postal VARCHAR(10),
  specialites JSONB DEFAULT '[]',
  certifications JSONB DEFAULT '[]',
  membre_depuis DATE,
  statut VARCHAR(20) DEFAULT 'actif',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assoc_membres_assoc ON association_membres(association_id);
CREATE INDEX IF NOT EXISTS idx_assoc_membres_nom ON association_membres(entreprise_nom);
CREATE INDEX IF NOT EXISTS idx_assoc_membres_ville ON association_membres(ville);

-- ============================================================
-- TABLE: Soumissions (tracking des appels d'offres)
-- ============================================================
CREATE TABLE IF NOT EXISTS soumissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  appel_offre_id VARCHAR(100),
  appel_offre_source VARCHAR(20),
  appel_offre_titre TEXT,
  numero_soumission VARCHAR(100),
  date_soumission DATE,
  montant_soumis NUMERIC(15,2),
  statut VARCHAR(50) DEFAULT 'en_preparation' CHECK (statut IN (
    'en_preparation', 'soumise', 'en_evaluation', 'gagnee', 'perdue', 'annulee', 'retiree'
  )),
  date_decision DATE,
  montant_gagnant NUMERIC(15,2),
  entrepreneur_gagnant VARCHAR(255),
  notes TEXT,
  documents JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_soumissions_user ON soumissions(user_id);
CREATE INDEX IF NOT EXISTS idx_soumissions_projet ON soumissions(project_id);
CREATE INDEX IF NOT EXISTS idx_soumissions_statut ON soumissions(statut);

-- ============================================================
-- FONCTIONS
-- ============================================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN 
    SELECT table_name 
    FROM information_schema.columns 
    WHERE column_name = 'updated_at' 
    AND table_schema = 'public'
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS update_%I_updated_at ON %I;
      CREATE TRIGGER update_%I_updated_at
      BEFORE UPDATE ON %I
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    ', t, t, t, t);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================

-- Enable RLS on user-specific tables
ALTER TABLE seao_alertes ENABLE ROW LEVEL SECURITY;
ALTER TABLE appels_offres_favoris ENABLE ROW LEVEL SECURITY;
ALTER TABLE appels_offres_alertes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_associations ENABLE ROW LEVEL SECURITY;
ALTER TABLE soumissions ENABLE ROW LEVEL SECURITY;

-- Policies pour seao_alertes
CREATE POLICY "Users can view own alerts" ON seao_alertes
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own alerts" ON seao_alertes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own alerts" ON seao_alertes
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own alerts" ON seao_alertes
  FOR DELETE USING (auth.uid() = user_id);

-- Policies pour appels_offres_favoris
CREATE POLICY "Users can view own favorites" ON appels_offres_favoris
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own favorites" ON appels_offres_favoris
  FOR ALL USING (auth.uid() = user_id);

-- Policies pour appels_offres_alertes
CREATE POLICY "Users can view own ao alerts" ON appels_offres_alertes
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own ao alerts" ON appels_offres_alertes
  FOR ALL USING (auth.uid() = user_id);

-- Policies pour user_associations
CREATE POLICY "Users can view own associations" ON user_associations
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own associations" ON user_associations
  FOR ALL USING (auth.uid() = user_id);

-- Policies pour soumissions
CREATE POLICY "Users can view own submissions" ON soumissions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own submissions" ON soumissions
  FOR ALL USING (auth.uid() = user_id);

-- Tables publiques (lecture seule pour tous)
ALTER TABLE rbq_entrepreneurs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read rbq" ON rbq_entrepreneurs FOR SELECT USING (true);

ALTER TABLE seao_appels_offres ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read seao" ON seao_appels_offres FOR SELECT USING (true);

ALTER TABLE ccq_taux_horaires ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read ccq rates" ON ccq_taux_horaires FOR SELECT USING (true);

ALTER TABLE association_membres ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read association members" ON association_membres FOR SELECT USING (true);

-- ============================================================
-- DONNÉES INITIALES
-- ============================================================

-- Insérer quelques appels d'offres SEAO de démonstration
INSERT INTO seao_appels_offres (numero_seao, titre, organisme, organisme_type, type, categorie, region, ville, date_publication, date_fermeture, estimation_min, estimation_max, description, statut, url_seao)
VALUES 
  ('SEAO-2026-0001', 'Rénovation école primaire Saint-Jean-Baptiste', 'Centre de services scolaire de Montréal', 'Éducation', 'construction', 'batiment', 'Montréal', 'Montréal', '2026-01-10', '2026-02-15', 2500000, 3500000, 'Travaux de rénovation majeurs incluant toiture, fenestration, CVAC et accessibilité universelle', 'ouvert', 'https://seao.ca/OpportuniteAffaires/SEAO-2026-0001'),
  ('SEAO-2026-0002', 'Construction nouveau centre sportif', 'Ville de Laval', 'Municipal', 'construction', 'batiment', 'Laval', 'Laval', '2026-01-12', '2026-02-28', 15000000, 22000000, 'Construction d''un centre sportif multifonctionnel de 6000 m² avec piscine et gymnases', 'ouvert', 'https://seao.ca/OpportuniteAffaires/SEAO-2026-0002'),
  ('SEAO-2026-0003', 'Réfection boulevard Henri-Bourassa', 'Ville de Québec', 'Municipal', 'construction', 'genie_civil', 'Capitale-Nationale', 'Québec', '2026-01-08', '2026-02-10', 5000000, 7500000, 'Réfection complète de la chaussée sur 3.5 km incluant infrastructures souterraines', 'ouvert', 'https://seao.ca/OpportuniteAffaires/SEAO-2026-0003'),
  ('SEAO-2026-0004', 'Agrandissement CHSLD Sainte-Anne', 'CISSS de la Montérégie-Ouest', 'Santé', 'construction', 'batiment', 'Montérégie', 'Saint-Anne-de-Bellevue', '2026-01-05', '2026-02-20', 8000000, 12000000, 'Agrandissement de 40 lits avec services connexes', 'ouvert', 'https://seao.ca/OpportuniteAffaires/SEAO-2026-0004')
ON CONFLICT (numero_seao) DO NOTHING;

-- Insérer les taux CCQ 2025-2026
INSERT INTO ccq_taux_horaires (id, metier, classification, secteur, taux_base, vacances, conges_feries, avantages_sociaux, fonds_formation, regime_retraite, assurance, total_employeur, date_vigueur, convention_collective)
VALUES 
  ('CI_Briqueteur_macon', 'Briqueteur-maçon', 'compagnon', 'CI', 47.89, 6.23, 4.07, 4.75, 0.25, 4.79, 2.87, 70.85, '2025-05-01', 'Convention collective IC 2025-2029'),
  ('CI_Charpentier_menuisier', 'Charpentier-menuisier', 'compagnon', 'CI', 46.85, 6.09, 3.98, 4.65, 0.25, 4.69, 2.81, 69.32, '2025-05-01', 'Convention collective IC 2025-2029'),
  ('CI_Electricien', 'Électricien', 'compagnon', 'CI', 49.52, 6.44, 4.21, 4.91, 0.25, 4.95, 2.97, 73.25, '2025-05-01', 'Convention collective IC 2025-2029'),
  ('CI_Plombier', 'Plombier', 'compagnon', 'CI', 49.15, 6.39, 4.18, 4.87, 0.25, 4.92, 2.95, 72.71, '2025-05-01', 'Convention collective IC 2025-2029'),
  ('CI_Ferrailleur', 'Ferrailleur', 'compagnon', 'CI', 46.45, 6.04, 3.95, 4.61, 0.25, 4.65, 2.79, 68.74, '2025-05-01', 'Convention collective IC 2025-2029'),
  ('RE_Briqueteur_macon', 'Briqueteur-maçon', 'compagnon', 'RE', 45.25, 5.88, 3.85, 4.49, 0.22, 4.53, 2.71, 66.93, '2025-05-01', 'Convention collective Résidentiel 2025-2029'),
  ('RE_Charpentier_menuisier', 'Charpentier-menuisier', 'compagnon', 'RE', 44.35, 5.77, 3.77, 4.40, 0.22, 4.44, 2.66, 65.61, '2025-05-01', 'Convention collective Résidentiel 2025-2029'),
  ('RE_Electricien', 'Électricien', 'compagnon', 'RE', 46.89, 6.10, 3.99, 4.65, 0.22, 4.69, 2.81, 69.35, '2025-05-01', 'Convention collective Résidentiel 2025-2029'),
  ('RE_Plombier', 'Plombier', 'compagnon', 'RE', 46.52, 6.05, 3.95, 4.61, 0.22, 4.65, 2.79, 68.79, '2025-05-01', 'Convention collective Résidentiel 2025-2029'),
  ('GC_Operateur_equipement', 'Opérateur d''équipement lourd', 'compagnon', 'GC', 44.85, 5.83, 3.81, 4.45, 0.25, 4.49, 2.69, 66.37, '2025-05-01', 'Convention collective GC 2025-2029'),
  ('IC_Tuyauteur', 'Tuyauteur', 'compagnon', 'IC', 51.25, 6.66, 4.36, 5.08, 0.25, 5.13, 3.08, 75.81, '2025-05-01', 'Convention collective IC 2025-2029'),
  ('IC_Monteur_acier', 'Monteur d''acier de structure', 'compagnon', 'IC', 48.95, 6.36, 4.16, 4.86, 0.25, 4.90, 2.94, 72.42, '2025-05-01', 'Convention collective IC 2025-2029')
ON CONFLICT (id) DO UPDATE SET
  taux_base = EXCLUDED.taux_base,
  total_employeur = EXCLUDED.total_employeur,
  updated_at = NOW();

COMMENT ON TABLE rbq_entrepreneurs IS 'Cache des entrepreneurs RBQ avec licences et infractions';
COMMENT ON TABLE seao_appels_offres IS 'Appels d''offres du Système électronique d''appels d''offres du Québec';
COMMENT ON TABLE ccq_taux_horaires IS 'Taux horaires CCQ par métier, secteur et classification';
COMMENT ON TABLE soumissions IS 'Suivi des soumissions aux appels d''offres';
