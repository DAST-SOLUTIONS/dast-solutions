-- ============================================================
-- DAST Solutions - Modules Takeoff Avancé, Conception, Stockage
-- Tables pour gestion avancée des plans et documents
-- ============================================================

-- PARTIE 1: TAKEOFF AVANCE

-- TABLE DRAWING_SETS (Jeux de plans)

CREATE TABLE IF NOT EXISTS drawing_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  project_id UUID,
  
  name VARCHAR(200) NOT NULL,
  version VARCHAR(20) DEFAULT '1.0',
  issue_date DATE,
  received_date DATE,
  
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'for_review', 'approved', 'superseded')),
  
  description TEXT,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drawing_sets_user ON drawing_sets(user_id);
CREATE INDEX IF NOT EXISTS idx_drawing_sets_project ON drawing_sets(project_id);
CREATE INDEX IF NOT EXISTS idx_drawing_sets_status ON drawing_sets(status);

ALTER TABLE drawing_sets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own drawing sets" ON drawing_sets;
CREATE POLICY "Users can manage own drawing sets" ON drawing_sets
  FOR ALL USING (user_id = auth.uid());


-- TABLE DRAWINGS (Plans individuels)

CREATE TABLE IF NOT EXISTS drawings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id UUID REFERENCES drawing_sets(id) ON DELETE CASCADE,
  
  number VARCHAR(50) NOT NULL,
  name VARCHAR(300) NOT NULL,
  discipline VARCHAR(10) DEFAULT 'A',
  
  scale VARCHAR(20),
  sheet_size VARCHAR(20),
  
  file_url TEXT,
  file_type VARCHAR(100),
  file_size INTEGER,
  page_count INTEGER DEFAULT 1,
  current_page INTEGER DEFAULT 1,
  
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'measured', 'verified')),
  
  ocr_number VARCHAR(50),
  ocr_name VARCHAR(300),
  ocr_processed BOOLEAN DEFAULT FALSE,
  
  version_history JSONB DEFAULT '[]',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drawings_set ON drawings(set_id);
CREATE INDEX IF NOT EXISTS idx_drawings_number ON drawings(number);
CREATE INDEX IF NOT EXISTS idx_drawings_discipline ON drawings(discipline);
CREATE INDEX IF NOT EXISTS idx_drawings_status ON drawings(status);


-- TABLE TAKEOFF_ITEMS (Elements de releve)

CREATE TABLE IF NOT EXISTS takeoff_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  project_id UUID,
  drawing_id UUID REFERENCES drawings(id) ON DELETE CASCADE,
  
  category VARCHAR(50) NOT NULL,
  subcategory VARCHAR(50),
  description VARCHAR(300) NOT NULL,
  
  measurement_type VARCHAR(20) NOT NULL CHECK (measurement_type IN ('linear', 'area', 'count', 'volume')),
  quantity DECIMAL(14,4) NOT NULL DEFAULT 0,
  unit VARCHAR(20) NOT NULL,
  
  unit_cost DECIMAL(14,2),
  total_cost DECIMAL(14,2),
  
  color VARCHAR(20) DEFAULT '#3b82f6',
  points JSONB DEFAULT '[]',
  
  conditions TEXT[],
  notes TEXT,
  
  linked_estimate_item UUID,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_takeoff_items_user ON takeoff_items(user_id);
CREATE INDEX IF NOT EXISTS idx_takeoff_items_project ON takeoff_items(project_id);
CREATE INDEX IF NOT EXISTS idx_takeoff_items_drawing ON takeoff_items(drawing_id);
CREATE INDEX IF NOT EXISTS idx_takeoff_items_category ON takeoff_items(category);

ALTER TABLE takeoff_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own takeoff items" ON takeoff_items;
CREATE POLICY "Users can manage own takeoff items" ON takeoff_items
  FOR ALL USING (user_id = auth.uid());


-- TABLE DRAWING_ANNOTATIONS (Annotations sur plans)

CREATE TABLE IF NOT EXISTS drawing_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drawing_id UUID REFERENCES drawings(id) ON DELETE CASCADE,
  
  type VARCHAR(20) NOT NULL CHECK (type IN ('text', 'callout', 'cloud', 'arrow', 'highlight', 'dimension')),
  content TEXT,
  
  position_x DECIMAL(10,2),
  position_y DECIMAL(10,2),
  width DECIMAL(10,2),
  height DECIMAL(10,2),
  
  color VARCHAR(20) DEFAULT '#ef4444',
  
  created_by VARCHAR(200),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drawing_annotations_drawing ON drawing_annotations(drawing_id);


-- PARTIE 2: CONCEPTION

-- TABLE CONCEPTION_DOCUMENTS (Documents de conception)

CREATE TABLE IF NOT EXISTS conception_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  project_id UUID,
  
  name VARCHAR(300) NOT NULL,
  discipline VARCHAR(10) DEFAULT 'A',
  type VARCHAR(30) DEFAULT 'plan' CHECK (type IN ('plan', 'specification', 'detail', 'schedule', 'report', 'model')),
  
  file_url TEXT,
  file_type VARCHAR(100),
  file_size INTEGER,
  
  version VARCHAR(20) DEFAULT '1.0',
  status VARCHAR(30) DEFAULT 'draft' CHECK (status IN ('draft', 'for_review', 'approved', 'revision_required')),
  
  created_by VARCHAR(200),
  
  annotations JSONB DEFAULT '[]',
  comments JSONB DEFAULT '[]',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conception_documents_user ON conception_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_conception_documents_project ON conception_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_conception_documents_discipline ON conception_documents(discipline);
CREATE INDEX IF NOT EXISTS idx_conception_documents_status ON conception_documents(status);

ALTER TABLE conception_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own conception docs" ON conception_documents;
CREATE POLICY "Users can manage own conception docs" ON conception_documents
  FOR ALL USING (user_id = auth.uid());


-- TABLE CONCEPTION_REVIEWS (Revues de conception)

CREATE TABLE IF NOT EXISTS conception_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  project_id UUID,
  document_id UUID REFERENCES conception_documents(id) ON DELETE CASCADE,
  
  type VARCHAR(20) NOT NULL CHECK (type IN ('comment', 'issue', 'approval')),
  content TEXT NOT NULL,
  
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  
  assigned_to VARCHAR(200),
  due_date DATE,
  
  created_by VARCHAR(200),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conception_reviews_user ON conception_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_conception_reviews_project ON conception_reviews(project_id);
CREATE INDEX IF NOT EXISTS idx_conception_reviews_document ON conception_reviews(document_id);
CREATE INDEX IF NOT EXISTS idx_conception_reviews_status ON conception_reviews(status);

ALTER TABLE conception_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own reviews" ON conception_reviews;
CREATE POLICY "Users can manage own reviews" ON conception_reviews
  FOR ALL USING (user_id = auth.uid());


-- PARTIE 3: STOCKAGE STRUCTURE

-- TABLE STORAGE_ITEMS (Elements de stockage)

CREATE TABLE IF NOT EXISTS storage_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  project_id UUID,
  
  name VARCHAR(300) NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('folder', 'file')),
  parent_id UUID REFERENCES storage_items(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  
  size INTEGER,
  file_type VARCHAR(100),
  file_url TEXT,
  
  is_template BOOLEAN DEFAULT FALSE,
  is_starred BOOLEAN DEFAULT FALSE,
  is_shared BOOLEAN DEFAULT FALSE,
  
  created_by VARCHAR(200),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_storage_items_user ON storage_items(user_id);
CREATE INDEX IF NOT EXISTS idx_storage_items_project ON storage_items(project_id);
CREATE INDEX IF NOT EXISTS idx_storage_items_parent ON storage_items(parent_id);
CREATE INDEX IF NOT EXISTS idx_storage_items_type ON storage_items(type);
CREATE INDEX IF NOT EXISTS idx_storage_items_path ON storage_items(path);

ALTER TABLE storage_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own storage" ON storage_items;
CREATE POLICY "Users can manage own storage" ON storage_items
  FOR ALL USING (user_id = auth.uid());


-- TABLE FOLDER_TEMPLATES (Gabarits de dossiers)

CREATE TABLE IF NOT EXISTS folder_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  
  name VARCHAR(200) NOT NULL,
  description TEXT,
  
  structure JSONB NOT NULL DEFAULT '[]',
  
  category VARCHAR(30) DEFAULT 'project' CHECK (category IN ('business', 'project', 'estimation', 'gestion')),
  is_default BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_folder_templates_user ON folder_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_folder_templates_category ON folder_templates(category);

ALTER TABLE folder_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own templates" ON folder_templates;
CREATE POLICY "Users can manage own templates" ON folder_templates
  FOR ALL USING (user_id = auth.uid());


-- VUES

CREATE OR REPLACE VIEW v_takeoff_summary AS
SELECT 
  ti.project_id,
  ti.category,
  ti.measurement_type,
  COUNT(*) as item_count,
  SUM(ti.quantity) as total_quantity,
  ti.unit,
  SUM(ti.total_cost) as total_cost
FROM takeoff_items ti
GROUP BY ti.project_id, ti.category, ti.measurement_type, ti.unit;


CREATE OR REPLACE VIEW v_storage_usage AS
SELECT 
  user_id,
  project_id,
  COUNT(*) FILTER (WHERE type = 'folder') as folder_count,
  COUNT(*) FILTER (WHERE type = 'file') as file_count,
  COALESCE(SUM(size) FILTER (WHERE type = 'file'), 0) as total_size
FROM storage_items
GROUP BY user_id, project_id;


-- TRIGGERS

DROP TRIGGER IF EXISTS update_drawing_sets_updated_at ON drawing_sets;
CREATE TRIGGER update_drawing_sets_updated_at
  BEFORE UPDATE ON drawing_sets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_drawings_updated_at ON drawings;
CREATE TRIGGER update_drawings_updated_at
  BEFORE UPDATE ON drawings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_takeoff_items_updated_at ON takeoff_items;
CREATE TRIGGER update_takeoff_items_updated_at
  BEFORE UPDATE ON takeoff_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conception_documents_updated_at ON conception_documents;
CREATE TRIGGER update_conception_documents_updated_at
  BEFORE UPDATE ON conception_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_storage_items_updated_at ON storage_items;
CREATE TRIGGER update_storage_items_updated_at
  BEFORE UPDATE ON storage_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- Trigger: Calcul automatique du cout total takeoff
CREATE OR REPLACE FUNCTION calculate_takeoff_total_cost()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.unit_cost IS NOT NULL THEN
    NEW.total_cost = NEW.quantity * NEW.unit_cost;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_takeoff_cost ON takeoff_items;
CREATE TRIGGER trigger_calculate_takeoff_cost
  BEFORE INSERT OR UPDATE ON takeoff_items
  FOR EACH ROW EXECUTE FUNCTION calculate_takeoff_total_cost();


-- FIN MIGRATION TAKEOFF, CONCEPTION, STOCKAGE
