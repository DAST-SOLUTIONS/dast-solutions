-- ============================================================================
-- DAST Solutions - Migration 011: Uploads & Takeoff COMPLET
-- Exécuter dans Supabase Dashboard > SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. TABLE: project_documents (Documents du projet)
-- ============================================================================
CREATE TABLE IF NOT EXISTS project_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  filename TEXT NOT NULL,
  original_name TEXT,
  storage_path TEXT NOT NULL,
  file_url TEXT,
  file_size BIGINT,
  mime_type TEXT,
  category TEXT DEFAULT 'general', -- plans, devis, contrats, photos, general
  description TEXT,
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_project_documents_project ON project_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_project_documents_user ON project_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_project_documents_category ON project_documents(category);

-- RLS
ALTER TABLE project_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own documents" ON project_documents;
CREATE POLICY "Users can view own documents" ON project_documents
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create documents" ON project_documents;
CREATE POLICY "Users can create documents" ON project_documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own documents" ON project_documents;
CREATE POLICY "Users can update own documents" ON project_documents
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own documents" ON project_documents;
CREATE POLICY "Users can delete own documents" ON project_documents
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 2. TABLE: takeoff_plans (Plans pour Takeoff)
-- ============================================================================
CREATE TABLE IF NOT EXISTS takeoff_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  filename TEXT NOT NULL,
  original_name TEXT,
  storage_path TEXT NOT NULL,
  file_url TEXT,
  file_size BIGINT,
  page_count INTEGER DEFAULT 1,
  name TEXT,
  numero TEXT,
  discipline TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_takeoff_plans_project ON takeoff_plans(project_id);
CREATE INDEX IF NOT EXISTS idx_takeoff_plans_user ON takeoff_plans(user_id);

-- RLS
ALTER TABLE takeoff_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own plans" ON takeoff_plans;
CREATE POLICY "Users can view own plans" ON takeoff_plans
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create plans" ON takeoff_plans;
CREATE POLICY "Users can create plans" ON takeoff_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own plans" ON takeoff_plans;
CREATE POLICY "Users can update own plans" ON takeoff_plans
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own plans" ON takeoff_plans;
CREATE POLICY "Users can delete own plans" ON takeoff_plans
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 3. TABLE: takeoff_calibrations (Calibration échelle)
-- ============================================================================
CREATE TABLE IF NOT EXISTS takeoff_calibrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES takeoff_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  page_number INTEGER DEFAULT 1,
  point1_x DOUBLE PRECISION NOT NULL,
  point1_y DOUBLE PRECISION NOT NULL,
  point2_x DOUBLE PRECISION NOT NULL,
  point2_y DOUBLE PRECISION NOT NULL,
  real_distance DOUBLE PRECISION NOT NULL,
  real_unit TEXT DEFAULT 'pi',
  pixels_per_unit DOUBLE PRECISION NOT NULL,
  scale_ratio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(plan_id, page_number, user_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_takeoff_calibrations_plan ON takeoff_calibrations(plan_id);

-- RLS
ALTER TABLE takeoff_calibrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own calibrations" ON takeoff_calibrations;
CREATE POLICY "Users can manage own calibrations" ON takeoff_calibrations
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- 4. TABLE: takeoff_measures (Mesures)
-- ============================================================================
CREATE TABLE IF NOT EXISTS takeoff_measures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES takeoff_plans(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  page_number INTEGER DEFAULT 1,
  type TEXT NOT NULL CHECK (type IN ('line', 'rectangle', 'polygon', 'count', 'area')),
  points JSONB NOT NULL DEFAULT '[]',
  value DOUBLE PRECISION DEFAULT 0,
  unit TEXT DEFAULT 'unité',
  label TEXT NOT NULL,
  category TEXT,
  subcategory TEXT,
  color TEXT DEFAULT '#3B82F6',
  unit_price DOUBLE PRECISION DEFAULT 0,
  total_price DOUBLE PRECISION DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_takeoff_measures_project ON takeoff_measures(project_id);
CREATE INDEX IF NOT EXISTS idx_takeoff_measures_plan ON takeoff_measures(plan_id);
CREATE INDEX IF NOT EXISTS idx_takeoff_measures_user ON takeoff_measures(user_id);

-- RLS
ALTER TABLE takeoff_measures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own measures" ON takeoff_measures;
CREATE POLICY "Users can view own measures" ON takeoff_measures
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create measures" ON takeoff_measures;
CREATE POLICY "Users can create measures" ON takeoff_measures
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own measures" ON takeoff_measures;
CREATE POLICY "Users can update own measures" ON takeoff_measures
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own measures" ON takeoff_measures;
CREATE POLICY "Users can delete own measures" ON takeoff_measures
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 5. STORAGE BUCKETS
-- Créer dans Supabase Dashboard > Storage > New bucket
-- ============================================================================

-- Bucket: project-documents
-- Public: false
-- File size limit: 50MB
-- Allowed types: application/pdf, image/*, application/msword, application/vnd.openxmlformats-officedocument.*

-- Bucket: takeoff-plans  
-- Public: true (pour afficher les PDF)
-- File size limit: 100MB
-- Allowed types: application/pdf, image/*

-- ============================================================================
-- 6. STORAGE POLICIES (exécuter séparément si nécessaire)
-- ============================================================================

-- Pour project-documents
/*
CREATE POLICY "Users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'project-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
*/

-- Pour takeoff-plans
/*
CREATE POLICY "Users can upload plans"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'takeoff-plans' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Anyone can view plans"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'takeoff-plans');

CREATE POLICY "Users can delete own plans"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'takeoff-plans' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
*/

-- ============================================================================
-- 7. TRIGGER pour updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_project_documents_updated_at ON project_documents;
CREATE TRIGGER update_project_documents_updated_at
  BEFORE UPDATE ON project_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_takeoff_plans_updated_at ON takeoff_plans;
CREATE TRIGGER update_takeoff_plans_updated_at
  BEFORE UPDATE ON takeoff_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_takeoff_calibrations_updated_at ON takeoff_calibrations;
CREATE TRIGGER update_takeoff_calibrations_updated_at
  BEFORE UPDATE ON takeoff_calibrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_takeoff_measures_updated_at ON takeoff_measures;
CREATE TRIGGER update_takeoff_measures_updated_at
  BEFORE UPDATE ON takeoff_measures
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================
