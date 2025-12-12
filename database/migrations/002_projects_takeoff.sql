-- ============================================================================
-- DAST Solutions - Migration 002: Table Projects
-- Exécuter dans Supabase SQL Editor
-- ============================================================================

-- Créer la table projects si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    project_type VARCHAR(100) DEFAULT 'Résidentiel',
    client_name VARCHAR(255),
    project_number VARCHAR(100),
    address TEXT,
    start_date DATE,
    end_date DATE,
    project_value DECIMAL(15, 2),
    timezone VARCHAR(100) DEFAULT 'America/Toronto',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects(created_at DESC);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Activer RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;

-- Policy: Les utilisateurs peuvent voir leurs propres projets
CREATE POLICY "Users can view their own projects"
    ON public.projects FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent créer leurs propres projets
CREATE POLICY "Users can create their own projects"
    ON public.projects FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent modifier leurs propres projets
CREATE POLICY "Users can update their own projects"
    ON public.projects FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent supprimer leurs propres projets
CREATE POLICY "Users can delete their own projects"
    ON public.projects FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- Tables liées aux projets
-- ============================================================================

-- Table takeoff_items (pour le module Takeoff)
CREATE TABLE IF NOT EXISTS public.takeoff_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    quantity DECIMAL(15, 4) NOT NULL DEFAULT 0,
    unit_price DECIMAL(15, 2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_takeoff_items_project_id ON public.takeoff_items(project_id);

ALTER TABLE public.takeoff_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage takeoff items for their projects" ON public.takeoff_items;
CREATE POLICY "Users can manage takeoff items for their projects"
    ON public.takeoff_items FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = takeoff_items.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- Table takeoff_documents (pour les plans PDF)
CREATE TABLE IF NOT EXISTS public.takeoff_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50),
    file_size INTEGER,
    page_count INTEGER DEFAULT 1,
    scale DECIMAL(10, 6) DEFAULT 0.02,
    scale_unit VARCHAR(10) DEFAULT 'm',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_takeoff_documents_project_id ON public.takeoff_documents(project_id);

ALTER TABLE public.takeoff_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage takeoff documents for their projects" ON public.takeoff_documents;
CREATE POLICY "Users can manage takeoff documents for their projects"
    ON public.takeoff_documents FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = takeoff_documents.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- Table takeoff_measurements (pour les mesures)
CREATE TABLE IF NOT EXISTS public.takeoff_measurements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    document_id UUID REFERENCES public.takeoff_documents(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL, -- 'line', 'area', 'rectangle', 'count'
    category VARCHAR(100),
    label VARCHAR(255),
    value DECIMAL(15, 4) NOT NULL DEFAULT 0,
    unit VARCHAR(50) NOT NULL DEFAULT 'm',
    color VARCHAR(20) DEFAULT '#3B82F6',
    page_number INTEGER DEFAULT 1,
    points JSONB, -- Stockage des coordonnées des points
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_takeoff_measurements_project_id ON public.takeoff_measurements(project_id);
CREATE INDEX IF NOT EXISTS idx_takeoff_measurements_document_id ON public.takeoff_measurements(document_id);

ALTER TABLE public.takeoff_measurements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage takeoff measurements for their projects" ON public.takeoff_measurements;
CREATE POLICY "Users can manage takeoff measurements for their projects"
    ON public.takeoff_measurements FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = takeoff_measurements.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- ============================================================================
-- Vérification
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Migration 002 terminée avec succès!';
    RAISE NOTICE 'Tables créées: projects, takeoff_items, takeoff_documents, takeoff_measurements';
END $$;
