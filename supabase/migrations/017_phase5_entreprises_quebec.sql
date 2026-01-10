-- ============================================================
-- DAST Solutions - Phase 5: Base de données Entreprises Québec
-- Répertoire 25K+ entreprises avec vérification RBQ
-- ============================================================

-- ============================================================
-- 1. TABLE COMPANIES_QUEBEC (Entreprises)
-- ============================================================

CREATE TABLE IF NOT EXISTS companies_quebec (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  
  -- Identification
  name VARCHAR(200) NOT NULL,
  legal_name VARCHAR(200),
  neq VARCHAR(20), -- Numéro d'entreprise du Québec
  company_type VARCHAR(50) DEFAULT 'subcontractor',
  specialties TEXT[] DEFAULT '{}',
  description TEXT,
  
  -- Coordonnées
  address VARCHAR(255),
  city VARCHAR(100),
  province VARCHAR(10) DEFAULT 'QC',
  postal_code VARCHAR(10),
  region VARCHAR(50),
  phone VARCHAR(20),
  phone_alt VARCHAR(20),
  fax VARCHAR(20),
  email VARCHAR(255),
  website VARCHAR(255),
  
  -- RBQ (Régie du bâtiment du Québec)
  rbq_license VARCHAR(20),
  rbq_status VARCHAR(20) CHECK (rbq_status IN ('active', 'suspended', 'revoked', 'expired', 'pending')),
  rbq_categories TEXT[] DEFAULT '{}',
  rbq_expiry_date DATE,
  rbq_verified_at TIMESTAMPTZ,
  rbq_verification_data JSONB,
  
  -- CCQ
  ccq_registered BOOLEAN DEFAULT FALSE,
  ccq_number VARCHAR(20),
  
  -- Informations business
  year_founded INTEGER,
  employees_count VARCHAR(20),
  annual_revenue VARCHAR(50),
  service_area TEXT[] DEFAULT '{}',
  
  -- Évaluations
  rating DECIMAL(3,2) DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  projects_completed INTEGER DEFAULT 0,
  
  -- Statuts
  is_verified BOOLEAN DEFAULT FALSE,
  is_preferred BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Contact principal
  contact_name VARCHAR(100),
  contact_title VARCHAR(100),
  contact_phone VARCHAR(20),
  contact_email VARCHAR(255),
  
  -- Métadonnées
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  source VARCHAR(50), -- manual, import, rbq_api, etc.
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_companies_quebec_user ON companies_quebec(user_id);
CREATE INDEX IF NOT EXISTS idx_companies_quebec_name ON companies_quebec(name);
CREATE INDEX IF NOT EXISTS idx_companies_quebec_city ON companies_quebec(city);
CREATE INDEX IF NOT EXISTS idx_companies_quebec_region ON companies_quebec(region);
CREATE INDEX IF NOT EXISTS idx_companies_quebec_rbq ON companies_quebec(rbq_license);
CREATE INDEX IF NOT EXISTS idx_companies_quebec_rbq_status ON companies_quebec(rbq_status);
CREATE INDEX IF NOT EXISTS idx_companies_quebec_type ON companies_quebec(company_type);
CREATE INDEX IF NOT EXISTS idx_companies_quebec_specialties ON companies_quebec USING GIN(specialties);

-- RLS
ALTER TABLE companies_quebec ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own companies" ON companies_quebec;
CREATE POLICY "Users can manage own companies" ON companies_quebec
  FOR ALL USING (user_id = auth.uid());


-- ============================================================
-- 2. TABLE RBQ_CATEGORIES (Catégories de licence RBQ)
-- ============================================================

CREATE TABLE IF NOT EXISTS rbq_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  name_en VARCHAR(200),
  parent_code VARCHAR(10),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insérer les catégories RBQ
INSERT INTO rbq_categories (code, name) VALUES
  ('1.1.1', 'Bâtiments résidentiels neufs'),
  ('1.1.2', 'Bâtiments résidentiels - rénovation'),
  ('1.2', 'Petits bâtiments'),
  ('1.3', 'Grands bâtiments'),
  ('1.4', 'Génie civil et ouvrages de génie civil'),
  ('2.1', 'Travaux de fondation et structure'),
  ('2.2', 'Travaux d''enveloppe'),
  ('2.3', 'Travaux de finition'),
  ('3', 'Travaux d''électricité'),
  ('4.1', 'Plomberie'),
  ('4.2', 'Chauffage'),
  ('4.3', 'Systèmes de ventilation'),
  ('5', 'Installations de gaz'),
  ('6', 'Appareils sous pression'),
  ('7', 'Systèmes de gicleurs'),
  ('8', 'Systèmes d''alarme incendie'),
  ('9', 'Ascenseurs et autres appareils élévateurs'),
  ('10', 'Systèmes de protection contre la foudre'),
  ('11', 'Travaux de forage et d''installation de puits'),
  ('12', 'Excavation et terrassement'),
  ('13', 'Routes et ponts'),
  ('14', 'Travaux de béton'),
  ('15', 'Travaux de maçonnerie'),
  ('16', 'Travaux de charpenterie')
ON CONFLICT (code) DO NOTHING;


-- ============================================================
-- 3. TABLE COMPANY_CONTACTS (Contacts multiples par entreprise)
-- ============================================================

CREATE TABLE IF NOT EXISTS company_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies_quebec(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  title VARCHAR(100),
  department VARCHAR(100),
  phone VARCHAR(20),
  phone_mobile VARCHAR(20),
  email VARCHAR(255),
  is_primary BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_contacts_company ON company_contacts(company_id);

ALTER TABLE company_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage contacts via company" ON company_contacts;
CREATE POLICY "Users can manage contacts via company" ON company_contacts
  FOR ALL USING (
    company_id IN (SELECT id FROM companies_quebec WHERE user_id = auth.uid())
  );


-- ============================================================
-- 4. TABLE COMPANY_PROJECTS (Projets réalisés par entreprise)
-- ============================================================

CREATE TABLE IF NOT EXISTS company_projects_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies_quebec(id) ON DELETE CASCADE,
  project_name VARCHAR(200) NOT NULL,
  project_type VARCHAR(50),
  location VARCHAR(100),
  year_completed INTEGER,
  contract_value DECIMAL(14,2),
  role VARCHAR(50), -- general, sub, supplier
  client_name VARCHAR(200),
  description TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_projects_company ON company_projects_history(company_id);

ALTER TABLE company_projects_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage project history via company" ON company_projects_history;
CREATE POLICY "Users can manage project history via company" ON company_projects_history
  FOR ALL USING (
    company_id IN (SELECT id FROM companies_quebec WHERE user_id = auth.uid())
  );


-- ============================================================
-- 5. TABLE COMPANY_RATINGS (Évaluations des entreprises)
-- ============================================================

CREATE TABLE IF NOT EXISTS company_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies_quebec(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  project_id UUID, -- Optionnel: lié à un projet DAST
  
  -- Scores (1-5)
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  timeliness_rating INTEGER CHECK (timeliness_rating >= 1 AND timeliness_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  pricing_rating INTEGER CHECK (pricing_rating >= 1 AND pricing_rating <= 5),
  safety_rating INTEGER CHECK (safety_rating >= 1 AND safety_rating <= 5),
  
  comments TEXT,
  would_recommend BOOLEAN,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_ratings_company ON company_ratings(company_id);
CREATE INDEX IF NOT EXISTS idx_company_ratings_user ON company_ratings(user_id);

ALTER TABLE company_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own ratings" ON company_ratings;
CREATE POLICY "Users can manage own ratings" ON company_ratings
  FOR ALL USING (user_id = auth.uid());


-- ============================================================
-- 6. TABLE RBQ_VERIFICATION_LOG (Historique vérifications RBQ)
-- ============================================================

CREATE TABLE IF NOT EXISTS rbq_verification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies_quebec(id) ON DELETE CASCADE,
  rbq_license VARCHAR(20),
  verification_date TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20),
  response_data JSONB,
  verified_by UUID REFERENCES auth.users(id),
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_rbq_verification_company ON rbq_verification_log(company_id);
CREATE INDEX IF NOT EXISTS idx_rbq_verification_date ON rbq_verification_log(verification_date);


-- ============================================================
-- 7. VUES
-- ============================================================

-- Vue entreprises avec stats
CREATE OR REPLACE VIEW v_companies_with_stats AS
SELECT 
  c.*,
  COALESCE(r.avg_rating, 0) as avg_rating,
  COALESCE(r.total_reviews, 0) as total_reviews,
  COALESCE(p.total_projects, 0) as total_projects_history
FROM companies_quebec c
LEFT JOIN (
  SELECT 
    company_id,
    ROUND(AVG(overall_rating)::numeric, 2) as avg_rating,
    COUNT(*) as total_reviews
  FROM company_ratings
  GROUP BY company_id
) r ON c.id = r.company_id
LEFT JOIN (
  SELECT 
    company_id,
    COUNT(*) as total_projects
  FROM company_projects_history
  GROUP BY company_id
) p ON c.id = p.company_id;


-- Vue résumé par région
CREATE OR REPLACE VIEW v_companies_by_region AS
SELECT 
  region,
  COUNT(*) as total_companies,
  COUNT(*) FILTER (WHERE rbq_status = 'active') as rbq_active,
  COUNT(*) FILTER (WHERE is_verified) as verified,
  COUNT(*) FILTER (WHERE is_preferred) as preferred
FROM companies_quebec
WHERE is_active = TRUE
GROUP BY region
ORDER BY total_companies DESC;


-- ============================================================
-- 8. FONCTION: Mettre à jour le rating moyen
-- ============================================================

CREATE OR REPLACE FUNCTION update_company_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE companies_quebec
  SET 
    rating = (
      SELECT ROUND(AVG(overall_rating)::numeric, 2)
      FROM company_ratings
      WHERE company_id = COALESCE(NEW.company_id, OLD.company_id)
    ),
    reviews_count = (
      SELECT COUNT(*)
      FROM company_ratings
      WHERE company_id = COALESCE(NEW.company_id, OLD.company_id)
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.company_id, OLD.company_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_company_rating ON company_ratings;
CREATE TRIGGER trigger_update_company_rating
  AFTER INSERT OR UPDATE OR DELETE ON company_ratings
  FOR EACH ROW EXECUTE FUNCTION update_company_rating();


-- ============================================================
-- 9. TRIGGERS updated_at
-- ============================================================

DROP TRIGGER IF EXISTS update_companies_quebec_updated_at ON companies_quebec;
CREATE TRIGGER update_companies_quebec_updated_at
  BEFORE UPDATE ON companies_quebec
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_company_contacts_updated_at ON company_contacts;
CREATE TRIGGER update_company_contacts_updated_at
  BEFORE UPDATE ON company_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- 10. DONNÉES EXEMPLE (Quelques entreprises pour démo)
-- ============================================================

-- Note: En production, ces données seraient importées d'une source externe
-- ou ajoutées manuellement par les utilisateurs


-- ============================================================
-- FIN MIGRATION
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration Phase 5 (Entreprises Québec) complétée!';
  RAISE NOTICE '   - Table companies_quebec créée';
  RAISE NOTICE '   - Table rbq_categories créée (24 catégories)';
  RAISE NOTICE '   - Table company_contacts créée';
  RAISE NOTICE '   - Table company_projects_history créée';
  RAISE NOTICE '   - Table company_ratings créée';
  RAISE NOTICE '   - Table rbq_verification_log créée';
  RAISE NOTICE '   - Vues et triggers configurés';
END $$;
