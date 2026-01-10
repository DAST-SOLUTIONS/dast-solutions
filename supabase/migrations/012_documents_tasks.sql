-- ============================================================================
-- DAST Solutions - Migration 012: Documents et Tâches de projet
-- Date: 9 janvier 2026
-- ============================================================================

-- ============================================================================
-- TABLE: project_documents - Documents de projet
-- ============================================================================
CREATE TABLE IF NOT EXISTS project_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Informations fichier
  name VARCHAR(255) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255),
  storage_path TEXT NOT NULL,
  file_url TEXT,
  file_size BIGINT DEFAULT 0,
  file_type VARCHAR(50),
  
  -- Classification
  document_type VARCHAR(50) DEFAULT 'other', -- plan, spec, contract, report, photo, other
  category VARCHAR(100),
  tags TEXT[],
  
  -- Versioning
  version INTEGER DEFAULT 1,
  parent_id UUID REFERENCES project_documents(id),
  
  -- Métadonnées
  description TEXT,
  status VARCHAR(50) DEFAULT 'active',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_project_documents_project ON project_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_project_documents_user ON project_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_project_documents_type ON project_documents(document_type);

-- RLS
ALTER TABLE project_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own project documents" ON project_documents;
CREATE POLICY "Users can view own project documents" ON project_documents
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own project documents" ON project_documents;
CREATE POLICY "Users can insert own project documents" ON project_documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own project documents" ON project_documents;
CREATE POLICY "Users can update own project documents" ON project_documents
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own project documents" ON project_documents;
CREATE POLICY "Users can delete own project documents" ON project_documents
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- TABLE: project_tasks - Tâches de projet pour le GANTT
-- ============================================================================
CREATE TABLE IF NOT EXISTS project_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Informations tâche
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Dates
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  actual_start_date DATE,
  actual_end_date DATE,
  
  -- Progression
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed, delayed, cancelled
  
  -- Assignation
  responsible VARCHAR(255),
  assigned_to UUID REFERENCES auth.users(id),
  
  -- Hiérarchie
  parent_task_id UUID REFERENCES project_tasks(id),
  sort_order INTEGER DEFAULT 0,
  
  -- Affichage
  color VARCHAR(20) DEFAULT '#14b8a6',
  is_milestone BOOLEAN DEFAULT FALSE,
  
  -- Dépendances (JSON array d'IDs de tâches)
  dependencies JSONB DEFAULT '[]',
  
  -- Budget
  estimated_hours DECIMAL(10,2),
  actual_hours DECIMAL(10,2),
  estimated_cost DECIMAL(12,2),
  actual_cost DECIMAL(12,2),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_project_tasks_project ON project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_user ON project_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_dates ON project_tasks(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_project_tasks_status ON project_tasks(status);

-- RLS
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own project tasks" ON project_tasks;
CREATE POLICY "Users can view own project tasks" ON project_tasks
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own project tasks" ON project_tasks;
CREATE POLICY "Users can insert own project tasks" ON project_tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own project tasks" ON project_tasks;
CREATE POLICY "Users can update own project tasks" ON project_tasks
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own project tasks" ON project_tasks;
CREATE POLICY "Users can delete own project tasks" ON project_tasks
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- STORAGE BUCKET: project-documents
-- ============================================================================
-- Créer le bucket pour les documents de projet (à faire dans Supabase Dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('project-documents', 'project-documents', true)
-- ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- TRIGGERS pour updated_at
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
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_project_tasks_updated_at ON project_tasks;
CREATE TRIGGER update_project_tasks_updated_at
    BEFORE UPDATE ON project_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================
