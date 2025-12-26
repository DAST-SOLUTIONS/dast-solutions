-- ============================================================================
-- DAST Solutions - Modules Phases 1-4 (CORRIGÉ)
-- ============================================================================

-- ============================================================================
-- PHASE 1: BOTTIN RESSOURCES
-- ============================================================================

CREATE TABLE IF NOT EXISTS bottin_individus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  prenom TEXT NOT NULL,
  nom TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('employe', 'sous_traitant', 'contact', 'fournisseur')),
  email TEXT,
  telephone TEXT,
  telephone_mobile TEXT,
  adresse TEXT,
  ville TEXT,
  code_postal TEXT,
  province TEXT DEFAULT 'QC',
  numero_ccq TEXT,
  metier_ccq TEXT,
  classification TEXT CHECK (classification IN ('compagnon', 'apprenti_1', 'apprenti_2', 'apprenti_3', 'manoeuvre')),
  taux_horaire_base DECIMAL(10,2) DEFAULT 0,
  taux_horaire_temps_demi DECIMAL(10,2) DEFAULT 0,
  taux_horaire_temps_double DECIMAL(10,2) DEFAULT 0,
  utiliser_taux_ccq BOOLEAN DEFAULT true,
  certifications JSONB DEFAULT '[]'::jsonb,
  actif BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bottin_equipements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  categorie TEXT NOT NULL CHECK (categorie IN ('nacelle', 'echafaud', 'skyjack', 'outillage', 'vehicule', 'grue', 'compresseur', 'autre')),
  numero_serie TEXT,
  marque TEXT,
  modele TEXT,
  cout_horaire DECIMAL(10,2) DEFAULT 0,
  cout_journalier DECIMAL(10,2) DEFAULT 0,
  cout_hebdomadaire DECIMAL(10,2) DEFAULT 0,
  cout_mensuel DECIMAL(10,2) DEFAULT 0,
  est_loue BOOLEAN DEFAULT false,
  fournisseur_location TEXT,
  equipement_statut TEXT DEFAULT 'disponible' CHECK (equipement_statut IN ('disponible', 'en_utilisation', 'maintenance', 'hors_service')),
  actif BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bottin_equipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  description TEXT,
  metier_principal TEXT,
  cout_horaire_total DECIMAL(10,2) DEFAULT 0,
  cout_journalier_total DECIMAL(10,2) DEFAULT 0,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bottin_equipe_membres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipe_id UUID REFERENCES bottin_equipes(id) ON DELETE CASCADE,
  individu_id UUID REFERENCES bottin_individus(id) ON DELETE CASCADE,
  role_equipe TEXT,
  heures_par_jour DECIMAL(4,2) DEFAULT 8,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(equipe_id, individu_id)
);

CREATE TABLE IF NOT EXISTS bottin_equipe_equipements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipe_id UUID REFERENCES bottin_equipes(id) ON DELETE CASCADE,
  equipement_id UUID REFERENCES bottin_equipements(id) ON DELETE CASCADE,
  quantite INTEGER DEFAULT 1,
  heures_par_jour DECIMAL(4,2) DEFAULT 8,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(equipe_id, equipement_id)
);

-- ============================================================================
-- PHASE 2: MATÉRIAUX & PRIX
-- ============================================================================

CREATE TABLE IF NOT EXISTS materiaux_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  nom TEXT NOT NULL,
  description TEXT,
  parent_code TEXT,
  niveau INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS materiaux_catalogue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT,
  nom TEXT NOT NULL,
  description TEXT,
  categorie_csc TEXT,
  unite TEXT NOT NULL DEFAULT 'U',
  unite_achat TEXT,
  facteur_conversion DECIMAL(10,4) DEFAULT 1,
  prix_unitaire DECIMAL(12,4) NOT NULL DEFAULT 0,
  prix_achat DECIMAL(12,4),
  devise TEXT DEFAULT 'CAD',
  fournisseur_nom TEXT,
  fournisseur_code TEXT,
  productivite_unite TEXT,
  productivite_valeur DECIMAL(10,4),
  metier_ccq TEXT,
  facteur_perte DECIMAL(5,2) DEFAULT 0,
  actif BOOLEAN DEFAULT true,
  favori BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS materiaux_prix_historique (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  materiau_id UUID REFERENCES materiaux_catalogue(id) ON DELETE CASCADE,
  prix_unitaire DECIMAL(12,4) NOT NULL,
  prix_achat DECIMAL(12,4),
  fournisseur_nom TEXT,
  source TEXT DEFAULT 'manuel',
  date_prix DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS materiaux_productivites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  description TEXT,
  categorie TEXT,
  unite_travail TEXT NOT NULL DEFAULT 'PI2',
  quantite_par_heure DECIMAL(10,4) NOT NULL,
  quantite_par_jour DECIMAL(10,4),
  facteur_simple DECIMAL(4,2) DEFAULT 1.0,
  facteur_moyen DECIMAL(4,2) DEFAULT 1.2,
  facteur_complexe DECIMAL(4,2) DEFAULT 1.5,
  facteur_tres_complexe DECIMAL(4,2) DEFAULT 2.0,
  metier_ccq TEXT,
  classification_min TEXT,
  source TEXT,
  reference TEXT,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PHASE 3: SOUMISSIONS V2
-- ============================================================================

CREATE TABLE IF NOT EXISTS soumissions_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID,
  numero TEXT NOT NULL,
  revision INTEGER DEFAULT 1,
  client_nom TEXT,
  client_adresse TEXT,
  client_contact TEXT,
  client_email TEXT,
  client_telephone TEXT,
  projet_nom TEXT,
  projet_adresse TEXT,
  projet_description TEXT,
  date_soumission DATE DEFAULT CURRENT_DATE,
  date_validite DATE,
  date_debut_travaux DATE,
  date_fin_travaux DATE,
  soumission_statut TEXT DEFAULT 'brouillon' CHECK (soumission_statut IN ('brouillon', 'envoye', 'accepte', 'refuse', 'expire')),
  sous_total_mo DECIMAL(12,2) DEFAULT 0,
  sous_total_materiaux DECIMAL(12,2) DEFAULT 0,
  sous_total_equipements DECIMAL(12,2) DEFAULT 0,
  sous_total_sous_traitants DECIMAL(12,2) DEFAULT 0,
  sous_total_direct DECIMAL(12,2) DEFAULT 0,
  frais_generaux_pct DECIMAL(5,2) DEFAULT 0,
  frais_generaux_montant DECIMAL(12,2) DEFAULT 0,
  administration_pct DECIMAL(5,2) DEFAULT 0,
  administration_montant DECIMAL(12,2) DEFAULT 0,
  profit_pct DECIMAL(5,2) DEFAULT 0,
  profit_montant DECIMAL(12,2) DEFAULT 0,
  contingence_pct DECIMAL(5,2) DEFAULT 0,
  contingence_montant DECIMAL(12,2) DEFAULT 0,
  total_avant_taxes DECIMAL(12,2) DEFAULT 0,
  tps DECIMAL(12,2) DEFAULT 0,
  tvq DECIMAL(12,2) DEFAULT 0,
  total_avec_taxes DECIMAL(12,2) DEFAULT 0,
  conditions TEXT,
  exclusions TEXT,
  notes_internes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS soumissions_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  soumission_id UUID REFERENCES soumissions_v2(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  code_csc TEXT,
  ordre INTEGER DEFAULT 0,
  sous_total_mo DECIMAL(12,2) DEFAULT 0,
  sous_total_materiaux DECIMAL(12,2) DEFAULT 0,
  sous_total DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS soumissions_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID REFERENCES soumissions_sections(id) ON DELETE CASCADE,
  numero_ligne INTEGER,
  description TEXT NOT NULL,
  quantite DECIMAL(12,4) DEFAULT 0,
  unite TEXT DEFAULT 'U',
  facteur_complexite DECIMAL(4,2) DEFAULT 1,
  productivite_id UUID REFERENCES materiaux_productivites(id),
  mo_taux_horaire DECIMAL(10,2) DEFAULT 0,
  mo_heures DECIMAL(10,2) DEFAULT 0,
  mo_cout_unitaire DECIMAL(10,4) DEFAULT 0,
  mo_cout_total DECIMAL(12,2) DEFAULT 0,
  materiau_id UUID REFERENCES materiaux_catalogue(id),
  mat_prix_unitaire DECIMAL(12,4) DEFAULT 0,
  mat_facteur_perte DECIMAL(5,2) DEFAULT 0,
  mat_cout_total DECIMAL(12,2) DEFAULT 0,
  equipement_id UUID REFERENCES bottin_equipements(id),
  equip_cout_unitaire DECIMAL(10,2) DEFAULT 0,
  equip_cout_total DECIMAL(12,2) DEFAULT 0,
  sous_traitant_nom TEXT,
  st_cout_total DECIMAL(12,2) DEFAULT 0,
  cout_total DECIMAL(12,2) DEFAULT 0,
  ordre INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PHASE 4: APPELS D'OFFRES
-- ============================================================================

CREATE TABLE IF NOT EXISTS appels_offres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID,
  soumission_id UUID REFERENCES soumissions_v2(id),
  numero TEXT NOT NULL,
  titre TEXT NOT NULL,
  description TEXT,
  etendue_travaux TEXT,
  documents_requis TEXT,
  specialite TEXT,
  code_csc TEXT,
  date_emission DATE DEFAULT CURRENT_DATE,
  date_limite DATE NOT NULL,
  date_visite_chantier DATE,
  heure_limite TIME DEFAULT '14:00',
  budget_estime DECIMAL(12,2),
  ao_statut TEXT DEFAULT 'brouillon' CHECK (ao_statut IN ('brouillon', 'envoye', 'en_cours', 'ferme', 'annule')),
  soumissionnaire_choisi_id UUID,
  montant_retenu DECIMAL(12,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS appels_offres_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appel_offre_id UUID REFERENCES appels_offres(id) ON DELETE CASCADE,
  individu_id UUID REFERENCES bottin_individus(id),
  entreprise_nom TEXT NOT NULL,
  contact_nom TEXT,
  email TEXT,
  telephone TEXT,
  invitation_statut TEXT DEFAULT 'a_envoyer' CHECK (invitation_statut IN ('a_envoyer', 'envoye', 'vu', 'decline', 'soumis')),
  date_envoi TIMESTAMPTZ,
  date_reponse TIMESTAMPTZ,
  a_soumissionne BOOLEAN DEFAULT false,
  raison_declin TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS appels_offres_soumissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appel_offre_id UUID REFERENCES appels_offres(id) ON DELETE CASCADE,
  invitation_id UUID REFERENCES appels_offres_invitations(id),
  entreprise_nom TEXT NOT NULL,
  contact_nom TEXT,
  email TEXT,
  telephone TEXT,
  numero_soumission TEXT,
  date_reception DATE DEFAULT CURRENT_DATE,
  montant_total DECIMAL(12,2) NOT NULL,
  montant_mo DECIMAL(12,2),
  montant_materiaux DECIMAL(12,2),
  date_validite DATE,
  delai_execution TEXT,
  inclusions TEXT,
  exclusions TEXT,
  conditions TEXT,
  documents JSONB DEFAULT '[]'::jsonb,
  note_prix INTEGER CHECK (note_prix BETWEEN 1 AND 5),
  note_qualite INTEGER CHECK (note_qualite BETWEEN 1 AND 5),
  note_delai INTEGER CHECK (note_delai BETWEEN 1 AND 5),
  note_globale DECIMAL(3,1),
  commentaires_evaluation TEXT,
  soumission_recue_statut TEXT DEFAULT 'recu' CHECK (soumission_recue_statut IN ('recu', 'en_evaluation', 'retenu', 'rejete')),
  est_retenu BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS appels_offres_comparatifs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appel_offre_id UUID REFERENCES appels_offres(id) ON DELETE CASCADE,
  nom TEXT DEFAULT 'Comparatif principal',
  criteres JSONB DEFAULT '[{"nom": "Prix", "poids": 40},{"nom": "Délai", "poids": 20},{"nom": "Qualité", "poids": 25},{"nom": "Étendue", "poids": 15}]'::jsonb,
  resultats JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEX
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_bottin_individus_user ON bottin_individus(user_id);
CREATE INDEX IF NOT EXISTS idx_bottin_individus_type ON bottin_individus(type);
CREATE INDEX IF NOT EXISTS idx_bottin_equipements_user ON bottin_equipements(user_id);
CREATE INDEX IF NOT EXISTS idx_bottin_equipes_user ON bottin_equipes(user_id);
CREATE INDEX IF NOT EXISTS idx_materiaux_catalogue_user ON materiaux_catalogue(user_id);
CREATE INDEX IF NOT EXISTS idx_materiaux_productivites_user ON materiaux_productivites(user_id);
CREATE INDEX IF NOT EXISTS idx_soumissions_v2_user ON soumissions_v2(user_id);
CREATE INDEX IF NOT EXISTS idx_appels_offres_user ON appels_offres(user_id);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE bottin_individus ENABLE ROW LEVEL SECURITY;
ALTER TABLE bottin_equipements ENABLE ROW LEVEL SECURITY;
ALTER TABLE bottin_equipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE materiaux_catalogue ENABLE ROW LEVEL SECURITY;
ALTER TABLE materiaux_productivites ENABLE ROW LEVEL SECURITY;
ALTER TABLE soumissions_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE appels_offres ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own individus" ON bottin_individus;
CREATE POLICY "Users manage own individus" ON bottin_individus FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own equipements" ON bottin_equipements;
CREATE POLICY "Users manage own equipements" ON bottin_equipements FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own equipes" ON bottin_equipes;
CREATE POLICY "Users manage own equipes" ON bottin_equipes FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own materiaux" ON materiaux_catalogue;
CREATE POLICY "Users manage own materiaux" ON materiaux_catalogue FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own productivites" ON materiaux_productivites;
CREATE POLICY "Users manage own productivites" ON materiaux_productivites FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own soumissions" ON soumissions_v2;
CREATE POLICY "Users manage own soumissions" ON soumissions_v2 FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own appels" ON appels_offres;
CREATE POLICY "Users manage own appels" ON appels_offres FOR ALL USING (auth.uid() = user_id);

-- Accès public aux catégories
DROP POLICY IF EXISTS "Public read categories" ON materiaux_categories;
CREATE POLICY "Public read categories" ON materiaux_categories FOR SELECT USING (true);

-- ============================================================================
-- DONNÉES INITIALES - Catégories CSC MasterFormat
-- ============================================================================

INSERT INTO materiaux_categories (id, code, nom, description, niveau) VALUES
  (gen_random_uuid(), '01', 'Exigences générales', 'General Requirements', 1),
  (gen_random_uuid(), '02', 'Conditions existantes', 'Existing Conditions', 1),
  (gen_random_uuid(), '03', 'Béton', 'Concrete', 1),
  (gen_random_uuid(), '04', 'Maçonnerie', 'Masonry', 1),
  (gen_random_uuid(), '05', 'Métaux', 'Metals', 1),
  (gen_random_uuid(), '06', 'Bois et plastiques', 'Wood, Plastics, and Composites', 1),
  (gen_random_uuid(), '07', 'Protection thermique et humidité', 'Thermal and Moisture Protection', 1),
  (gen_random_uuid(), '08', 'Ouvertures', 'Openings', 1),
  (gen_random_uuid(), '09', 'Finitions', 'Finishes', 1),
  (gen_random_uuid(), '10', 'Spécialités', 'Specialties', 1),
  (gen_random_uuid(), '11', 'Équipements', 'Equipment', 1),
  (gen_random_uuid(), '12', 'Ameublement', 'Furnishings', 1),
  (gen_random_uuid(), '13', 'Constructions spéciales', 'Special Construction', 1),
  (gen_random_uuid(), '14', 'Équipements de transport', 'Conveying Equipment', 1),
  (gen_random_uuid(), '21', 'Protection incendie', 'Fire Suppression', 1),
  (gen_random_uuid(), '22', 'Plomberie', 'Plumbing', 1),
  (gen_random_uuid(), '23', 'Chauffage, ventilation, climatisation', 'HVAC', 1),
  (gen_random_uuid(), '26', 'Électricité', 'Electrical', 1),
  (gen_random_uuid(), '27', 'Communications', 'Communications', 1),
  (gen_random_uuid(), '28', 'Sécurité électronique', 'Electronic Safety and Security', 1),
  (gen_random_uuid(), '31', 'Terrassement', 'Earthwork', 1),
  (gen_random_uuid(), '32', 'Aménagement extérieur', 'Exterior Improvements', 1),
  (gen_random_uuid(), '33', 'Services publics', 'Utilities', 1)
ON CONFLICT (code) DO NOTHING;
