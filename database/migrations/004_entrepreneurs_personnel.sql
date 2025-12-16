-- ============================================================================
-- DAST Solutions - Migration 004
-- Entrepreneurs, Personnel CCQ, Évaluations
-- Exécuter dans Supabase Dashboard > SQL Editor
-- ============================================================================

-- ============================================================================
-- PARTIE 1: MÉTIERS CCQ (Référentiel)
-- ============================================================================

CREATE TABLE IF NOT EXISTS metiers_ccq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) UNIQUE NOT NULL,
  nom VARCHAR(255) NOT NULL,
  description TEXT,
  taux_horaire DECIMAL(10,2) NOT NULL,
  taux_vacances DECIMAL(5,2) DEFAULT 13.00,
  taux_avantages DECIMAL(5,2) DEFAULT 15.50,
  categorie VARCHAR(100), -- 'Métier', 'Occupation', 'Spécialité'
  secteur VARCHAR(100), -- 'Institutionnel-Commercial', 'Industriel', 'Génie civil', 'Résidentiel'
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_metiers_ccq_code ON metiers_ccq(code);
CREATE INDEX IF NOT EXISTS idx_metiers_ccq_secteur ON metiers_ccq(secteur);

-- ============================================================================
-- PARTIE 2: ENTREPRENEURS (Sous-traitants)
-- ============================================================================

CREATE TABLE IF NOT EXISTS entrepreneurs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Informations générales
  nom VARCHAR(255) NOT NULL,
  nom_legal VARCHAR(255),
  neq VARCHAR(20), -- Numéro d'entreprise du Québec
  
  -- Licence RBQ
  rbq_licence VARCHAR(50),
  rbq_categories TEXT[], -- Array de catégories: ['1.1.1', '1.1.2', '2.2']
  rbq_status VARCHAR(20) DEFAULT 'valide', -- 'valide', 'suspendu', 'expire', 'non_verifie'
  rbq_date_verification TIMESTAMPTZ,
  rbq_date_expiration DATE,
  
  -- Adresse
  adresse_rue VARCHAR(255),
  adresse_ville VARCHAR(100),
  adresse_province VARCHAR(50) DEFAULT 'QC',
  adresse_code_postal VARCHAR(10),
  
  -- Spécialités et compétences
  specialites TEXT[], -- ['Maçonnerie', 'Béton', 'Charpente']
  corps_metier VARCHAR(100), -- Métier principal
  
  -- Statistiques
  evaluation_moyenne DECIMAL(3,2) DEFAULT 0,
  nb_evaluations INTEGER DEFAULT 0,
  projets_completes INTEGER DEFAULT 0,
  valeur_totale_projets DECIMAL(15,2) DEFAULT 0,
  
  -- Métadonnées
  notes TEXT,
  tags TEXT[],
  is_favori BOOLEAN DEFAULT false,
  is_actif BOOLEAN DEFAULT true,
  
  -- Dates
  date_premiere_collaboration DATE,
  derniere_activite TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_entrepreneurs_user ON entrepreneurs(user_id);
CREATE INDEX IF NOT EXISTS idx_entrepreneurs_neq ON entrepreneurs(neq);
CREATE INDEX IF NOT EXISTS idx_entrepreneurs_rbq ON entrepreneurs(rbq_licence);
CREATE INDEX IF NOT EXISTS idx_entrepreneurs_status ON entrepreneurs(rbq_status);
CREATE INDEX IF NOT EXISTS idx_entrepreneurs_favori ON entrepreneurs(is_favori);

-- ============================================================================
-- PARTIE 3: CONTACTS ENTREPRENEURS
-- ============================================================================

CREATE TABLE IF NOT EXISTS entrepreneur_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entrepreneur_id UUID REFERENCES entrepreneurs(id) ON DELETE CASCADE NOT NULL,
  
  nom VARCHAR(255) NOT NULL,
  prenom VARCHAR(255),
  poste VARCHAR(100),
  telephone VARCHAR(20),
  telephone_mobile VARCHAR(20),
  email VARCHAR(255),
  
  is_principal BOOLEAN DEFAULT false,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_entrepreneur_contacts_entrepreneur ON entrepreneur_contacts(entrepreneur_id);
CREATE INDEX IF NOT EXISTS idx_entrepreneur_contacts_principal ON entrepreneur_contacts(is_principal);

-- ============================================================================
-- PARTIE 4: ÉVALUATIONS ENTREPRENEURS
-- ============================================================================

CREATE TABLE IF NOT EXISTS entrepreneur_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entrepreneur_id UUID REFERENCES entrepreneurs(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Projet concerné
  projet_nom VARCHAR(255),
  projet_valeur DECIMAL(15,2),
  
  -- Notes (1 à 5)
  note_globale INTEGER CHECK (note_globale >= 1 AND note_globale <= 5),
  note_qualite INTEGER CHECK (note_qualite >= 1 AND note_qualite <= 5),
  note_delais INTEGER CHECK (note_delais >= 1 AND note_delais <= 5),
  note_communication INTEGER CHECK (note_communication >= 1 AND note_communication <= 5),
  note_prix INTEGER CHECK (note_prix >= 1 AND note_prix <= 5),
  note_securite INTEGER CHECK (note_securite >= 1 AND note_securite <= 5),
  
  -- Recommandation
  recommande BOOLEAN DEFAULT true,
  travaillerait_encore BOOLEAN DEFAULT true,
  
  -- Commentaires
  commentaire TEXT,
  points_forts TEXT[],
  points_amelioration TEXT[],
  
  -- Métadonnées
  date_evaluation DATE DEFAULT CURRENT_DATE,
  is_public BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_evaluations_entrepreneur ON entrepreneur_evaluations(entrepreneur_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_project ON entrepreneur_evaluations(project_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_date ON entrepreneur_evaluations(date_evaluation);

-- ============================================================================
-- PARTIE 5: PERSONNEL CCQ (Employés)
-- ============================================================================

CREATE TABLE IF NOT EXISTS personnel_ccq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Informations personnelles
  nom VARCHAR(255) NOT NULL,
  prenom VARCHAR(255) NOT NULL,
  date_naissance DATE,
  nas_encrypted TEXT, -- NAS chiffré (ne jamais stocker en clair)
  
  -- Contact
  telephone VARCHAR(20),
  telephone_urgence VARCHAR(20),
  email VARCHAR(255),
  
  -- Adresse
  adresse_rue VARCHAR(255),
  adresse_ville VARCHAR(100),
  adresse_province VARCHAR(50) DEFAULT 'QC',
  adresse_code_postal VARCHAR(10),
  
  -- Métier CCQ
  metier_ccq_id UUID REFERENCES metiers_ccq(id),
  metier_code VARCHAR(10),
  metier_nom VARCHAR(255),
  taux_horaire_actuel DECIMAL(10,2),
  
  -- Classification
  classification VARCHAR(50), -- 'Compagnon', 'Apprenti 1ère année', 'Apprenti 2e année', etc.
  numero_ccq VARCHAR(50), -- Numéro de carte CCQ
  date_emission_carte DATE,
  date_expiration_carte DATE,
  
  -- Compétences
  competences TEXT[],
  langues TEXT[] DEFAULT ARRAY['Français'],
  
  -- Emploi
  status VARCHAR(20) DEFAULT 'actif', -- 'actif', 'inactif', 'conge', 'termine'
  type_emploi VARCHAR(50) DEFAULT 'temps_plein', -- 'temps_plein', 'temps_partiel', 'occasionnel'
  date_embauche DATE,
  date_fin_emploi DATE,
  
  -- Statistiques
  heures_travaillees_total DECIMAL(10,2) DEFAULT 0,
  heures_travaillees_annee DECIMAL(10,2) DEFAULT 0,
  projets_assignes TEXT[],
  
  -- Équipements
  taille_vetement VARCHAR(10),
  taille_chaussure VARCHAR(10),
  equipements_fournis TEXT[],
  
  -- Métadonnées
  notes TEXT,
  photo_url TEXT,
  documents_url TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_personnel_user ON personnel_ccq(user_id);
CREATE INDEX IF NOT EXISTS idx_personnel_metier ON personnel_ccq(metier_ccq_id);
CREATE INDEX IF NOT EXISTS idx_personnel_status ON personnel_ccq(status);
CREATE INDEX IF NOT EXISTS idx_personnel_numero_ccq ON personnel_ccq(numero_ccq);

-- ============================================================================
-- PARTIE 6: CERTIFICATIONS PERSONNEL
-- ============================================================================

CREATE TABLE IF NOT EXISTS personnel_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  personnel_id UUID REFERENCES personnel_ccq(id) ON DELETE CASCADE NOT NULL,
  
  nom VARCHAR(255) NOT NULL,
  organisme VARCHAR(255), -- 'ASP Construction', 'CNESST', etc.
  numero_certificat VARCHAR(100),
  
  date_obtention DATE,
  date_expiration DATE,
  
  status VARCHAR(20) DEFAULT 'valide', -- 'valide', 'expire', 'bientot_expire'
  
  -- Document
  document_url TEXT,
  
  -- Rappels
  rappel_envoye BOOLEAN DEFAULT false,
  date_rappel TIMESTAMPTZ,
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_certifications_personnel ON personnel_certifications(personnel_id);
CREATE INDEX IF NOT EXISTS idx_certifications_expiration ON personnel_certifications(date_expiration);
CREATE INDEX IF NOT EXISTS idx_certifications_status ON personnel_certifications(status);

-- ============================================================================
-- PARTIE 7: ASSIGNATIONS PROJETS
-- ============================================================================

CREATE TABLE IF NOT EXISTS personnel_assignations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  personnel_id UUID REFERENCES personnel_ccq(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  
  role VARCHAR(100), -- 'Chef d'équipe', 'Ouvrier', 'Contremaître'
  date_debut DATE NOT NULL,
  date_fin DATE,
  
  heures_prevues DECIMAL(10,2),
  heures_travaillees DECIMAL(10,2) DEFAULT 0,
  
  taux_horaire DECIMAL(10,2),
  
  status VARCHAR(20) DEFAULT 'actif', -- 'actif', 'termine', 'annule'
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(personnel_id, project_id, date_debut)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_assignations_personnel ON personnel_assignations(personnel_id);
CREATE INDEX IF NOT EXISTS idx_assignations_project ON personnel_assignations(project_id);
CREATE INDEX IF NOT EXISTS idx_assignations_dates ON personnel_assignations(date_debut, date_fin);

-- ============================================================================
-- PARTIE 8: FONCTIONS ET TRIGGERS
-- ============================================================================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers updated_at
DROP TRIGGER IF EXISTS update_metiers_ccq_updated_at ON metiers_ccq;
CREATE TRIGGER update_metiers_ccq_updated_at
  BEFORE UPDATE ON metiers_ccq
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_entrepreneurs_updated_at ON entrepreneurs;
CREATE TRIGGER update_entrepreneurs_updated_at
  BEFORE UPDATE ON entrepreneurs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_entrepreneur_contacts_updated_at ON entrepreneur_contacts;
CREATE TRIGGER update_entrepreneur_contacts_updated_at
  BEFORE UPDATE ON entrepreneur_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_entrepreneur_evaluations_updated_at ON entrepreneur_evaluations;
CREATE TRIGGER update_entrepreneur_evaluations_updated_at
  BEFORE UPDATE ON entrepreneur_evaluations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_personnel_ccq_updated_at ON personnel_ccq;
CREATE TRIGGER update_personnel_ccq_updated_at
  BEFORE UPDATE ON personnel_ccq
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_personnel_certifications_updated_at ON personnel_certifications;
CREATE TRIGGER update_personnel_certifications_updated_at
  BEFORE UPDATE ON personnel_certifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_personnel_assignations_updated_at ON personnel_assignations;
CREATE TRIGGER update_personnel_assignations_updated_at
  BEFORE UPDATE ON personnel_assignations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour mettre à jour la moyenne des évaluations
CREATE OR REPLACE FUNCTION update_entrepreneur_evaluation_moyenne()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE entrepreneurs
  SET 
    evaluation_moyenne = (
      SELECT COALESCE(AVG(note_globale), 0)
      FROM entrepreneur_evaluations
      WHERE entrepreneur_id = COALESCE(NEW.entrepreneur_id, OLD.entrepreneur_id)
    ),
    nb_evaluations = (
      SELECT COUNT(*)
      FROM entrepreneur_evaluations
      WHERE entrepreneur_id = COALESCE(NEW.entrepreneur_id, OLD.entrepreneur_id)
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.entrepreneur_id, OLD.entrepreneur_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_evaluation_moyenne ON entrepreneur_evaluations;
CREATE TRIGGER trigger_update_evaluation_moyenne
  AFTER INSERT OR UPDATE OR DELETE ON entrepreneur_evaluations
  FOR EACH ROW EXECUTE FUNCTION update_entrepreneur_evaluation_moyenne();

-- Fonction pour vérifier le statut des certifications
CREATE OR REPLACE FUNCTION update_certification_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.date_expiration IS NOT NULL THEN
    IF NEW.date_expiration < CURRENT_DATE THEN
      NEW.status = 'expire';
    ELSIF NEW.date_expiration < CURRENT_DATE + INTERVAL '30 days' THEN
      NEW.status = 'bientot_expire';
    ELSE
      NEW.status = 'valide';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_certification_status ON personnel_certifications;
CREATE TRIGGER trigger_update_certification_status
  BEFORE INSERT OR UPDATE ON personnel_certifications
  FOR EACH ROW EXECUTE FUNCTION update_certification_status();

-- ============================================================================
-- PARTIE 9: RLS (Row Level Security)
-- ============================================================================

ALTER TABLE metiers_ccq ENABLE ROW LEVEL SECURITY;
ALTER TABLE entrepreneurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE entrepreneur_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE entrepreneur_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE personnel_ccq ENABLE ROW LEVEL SECURITY;
ALTER TABLE personnel_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE personnel_assignations ENABLE ROW LEVEL SECURITY;

-- Policies pour métiers CCQ (lecture publique)
DROP POLICY IF EXISTS "Metiers CCQ visibles par tous" ON metiers_ccq;
CREATE POLICY "Metiers CCQ visibles par tous" ON metiers_ccq
  FOR SELECT USING (true);

-- Policies pour entrepreneurs
DROP POLICY IF EXISTS "Entrepreneurs visibles par user" ON entrepreneurs;
CREATE POLICY "Entrepreneurs visibles par user" ON entrepreneurs
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Entrepreneurs modifiables par user" ON entrepreneurs;
CREATE POLICY "Entrepreneurs modifiables par user" ON entrepreneurs
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Entrepreneurs insertables" ON entrepreneurs;
CREATE POLICY "Entrepreneurs insertables" ON entrepreneurs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies pour personnel
DROP POLICY IF EXISTS "Personnel visible par user" ON personnel_ccq;
CREATE POLICY "Personnel visible par user" ON personnel_ccq
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Personnel modifiable par user" ON personnel_ccq;
CREATE POLICY "Personnel modifiable par user" ON personnel_ccq
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- PARTIE 10: DONNÉES INITIALES - MÉTIERS CCQ 2024-2025
-- ============================================================================

INSERT INTO metiers_ccq (code, nom, taux_horaire, taux_vacances, categorie, secteur) VALUES
-- Métiers de la construction
('01', 'Briqueteur-maçon', 47.25, 13.00, 'Métier', 'Institutionnel-Commercial'),
('02', 'Calorifugeur', 46.50, 13.00, 'Métier', 'Institutionnel-Commercial'),
('03', 'Carreleur', 45.00, 13.00, 'Métier', 'Institutionnel-Commercial'),
('04', 'Charpentier-menuisier', 45.75, 13.00, 'Métier', 'Institutionnel-Commercial'),
('05', 'Chaudronnier', 48.25, 13.00, 'Métier', 'Industriel'),
('06', 'Cimentier-applicateur', 44.50, 13.00, 'Métier', 'Institutionnel-Commercial'),
('07', 'Couvreur', 45.25, 13.00, 'Métier', 'Institutionnel-Commercial'),
('08', 'Électricien', 49.00, 13.00, 'Métier', 'Institutionnel-Commercial'),
('09', 'Ferblantier', 46.75, 13.00, 'Métier', 'Institutionnel-Commercial'),
('10', 'Ferrailleur', 46.25, 13.00, 'Métier', 'Institutionnel-Commercial'),
('11', 'Frigoriste', 50.00, 13.00, 'Métier', 'Institutionnel-Commercial'),
('12', 'Grutier', 51.50, 13.00, 'Métier', 'Institutionnel-Commercial'),
('13', 'Mécanicien d''ascenseur', 52.25, 13.00, 'Métier', 'Institutionnel-Commercial'),
('14', 'Mécanicien de machines lourdes', 49.75, 13.00, 'Métier', 'Génie civil'),
('15', 'Monteur-mécanicien (vitrier)', 46.00, 13.00, 'Métier', 'Institutionnel-Commercial'),
('16', 'Opérateur d''équipement lourd', 48.00, 13.00, 'Métier', 'Génie civil'),
('17', 'Opérateur de pelles', 49.00, 13.00, 'Métier', 'Génie civil'),
('18', 'Peintre', 44.25, 13.00, 'Métier', 'Institutionnel-Commercial'),
('19', 'Plâtrier', 45.50, 13.00, 'Métier', 'Institutionnel-Commercial'),
('20', 'Poseur de systèmes intérieurs', 44.75, 13.00, 'Métier', 'Institutionnel-Commercial'),
('21', 'Soudeur', 48.75, 13.00, 'Métier', 'Industriel'),
('22', 'Soudeur en tuyauterie', 50.25, 13.00, 'Métier', 'Industriel'),
('23', 'Tuyauteur', 50.50, 13.00, 'Métier', 'Institutionnel-Commercial'),
('24', 'Mécanicien en protection-incendie', 49.50, 13.00, 'Métier', 'Institutionnel-Commercial'),

-- Occupations
('30', 'Manœuvre', 37.25, 13.00, 'Occupation', 'Institutionnel-Commercial'),
('31', 'Manœuvre spécialisé', 39.00, 13.00, 'Occupation', 'Institutionnel-Commercial'),
('32', 'Manœuvre pipeline', 40.50, 13.00, 'Occupation', 'Génie civil'),
('33', 'Arpenteur', 45.75, 13.00, 'Occupation', 'Génie civil'),
('34', 'Boutefeu-foreur', 46.25, 13.00, 'Occupation', 'Génie civil'),
('35', 'Scaphandrier', 55.00, 13.00, 'Occupation', 'Génie civil'),

-- Résidentiel (taux différents)
('R01', 'Briqueteur-maçon (résidentiel)', 42.50, 13.00, 'Métier', 'Résidentiel'),
('R04', 'Charpentier-menuisier (résidentiel)', 41.25, 13.00, 'Métier', 'Résidentiel'),
('R08', 'Électricien (résidentiel)', 44.00, 13.00, 'Métier', 'Résidentiel'),
('R18', 'Peintre (résidentiel)', 39.75, 13.00, 'Métier', 'Résidentiel'),
('R23', 'Tuyauteur (résidentiel)', 45.50, 13.00, 'Métier', 'Résidentiel'),
('R30', 'Manœuvre (résidentiel)', 33.50, 13.00, 'Occupation', 'Résidentiel')

ON CONFLICT (code) DO UPDATE SET
  taux_horaire = EXCLUDED.taux_horaire,
  updated_at = NOW();

-- ============================================================================
-- PARTIE 11: DONNÉES DÉMO ENTREPRENEURS
-- ============================================================================

-- Note: Exécuter seulement si vous voulez des données de test
-- Remplacer 'YOUR_USER_ID' par votre vrai user_id

/*
INSERT INTO entrepreneurs (user_id, nom, neq, rbq_licence, rbq_categories, rbq_status, adresse_ville, specialites, is_favori)
VALUES 
  ('YOUR_USER_ID', 'Construction ABC Inc.', '1234567890', '5678-9012-34', ARRAY['1.1.1', '1.1.2'], 'valide', 'Montréal', ARRAY['Béton', 'Maçonnerie', 'Charpente'], true),
  ('YOUR_USER_ID', 'Électro-Plus Ltée', '9876543210', '1234-5678-90', ARRAY['2.2'], 'valide', 'Laval', ARRAY['Électricité'], true),
  ('YOUR_USER_ID', 'Plomberie Rapide Inc.', '5555555555', '9999-8888-77', ARRAY['2.1'], 'suspendu', 'Longueuil', ARRAY['Plomberie', 'CVAC'], false);
*/

-- ============================================================================
-- VÉRIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 004 terminée avec succès!';
  RAISE NOTICE '   - Tables créées: metiers_ccq, entrepreneurs, entrepreneur_contacts, entrepreneur_evaluations, personnel_ccq, personnel_certifications, personnel_assignations';
  RAISE NOTICE '   - Triggers configurés pour updated_at et calculs automatiques';
  RAISE NOTICE '   - RLS activé sur toutes les tables';
  RAISE NOTICE '   - 36 métiers CCQ insérés avec taux 2024-2025';
END $$;
