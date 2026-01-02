-- ============================================================================
-- DAST Solutions - Migration 003: Tables de Gestion de Projet
-- Exécuter dans Supabase Dashboard → SQL Editor → Run
-- ============================================================================

-- 1. Table des lignes de budget (Cost Management)
CREATE TABLE IF NOT EXISTS public.budget_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  division_code VARCHAR(10) NOT NULL,
  division_name VARCHAR(255),
  description TEXT,
  budget_original DECIMAL(15,2) DEFAULT 0,
  budget_approved DECIMAL(15,2) DEFAULT 0,
  budget_changes DECIMAL(15,2) DEFAULT 0,
  budget_current DECIMAL(15,2) DEFAULT 0,
  committed DECIMAL(15,2) DEFAULT 0,
  actual DECIMAL(15,2) DEFAULT 0,
  forecast DECIMAL(15,2) DEFAULT 0,
  variance DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour budget_lines
CREATE INDEX IF NOT EXISTS idx_budget_lines_project ON public.budget_lines(project_id);
CREATE INDEX IF NOT EXISTS idx_budget_lines_division ON public.budget_lines(division_code);

-- RLS pour budget_lines
ALTER TABLE public.budget_lines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own project budget lines" ON public.budget_lines;
CREATE POLICY "Users can view own project budget lines" ON public.budget_lines
  FOR SELECT USING (
    project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can manage own project budget lines" ON public.budget_lines;
CREATE POLICY "Users can manage own project budget lines" ON public.budget_lines
  FOR ALL USING (
    project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  );

-- 2. Table des ordres de changement (Change Orders)
CREATE TABLE IF NOT EXISTS public.change_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  number VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'void')),
  type VARCHAR(50) DEFAULT 'addition' CHECK (type IN ('addition', 'deduction', 'no_cost')),
  amount DECIMAL(15,2) DEFAULT 0,
  division_code VARCHAR(10),
  requested_by VARCHAR(255),
  approved_by VARCHAR(255),
  date_requested TIMESTAMPTZ DEFAULT NOW(),
  date_approved TIMESTAMPTZ,
  date_required TIMESTAMPTZ,
  reason TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour change_orders
CREATE INDEX IF NOT EXISTS idx_change_orders_project ON public.change_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_change_orders_status ON public.change_orders(status);
CREATE INDEX IF NOT EXISTS idx_change_orders_number ON public.change_orders(number);

-- RLS pour change_orders
ALTER TABLE public.change_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own project change orders" ON public.change_orders;
CREATE POLICY "Users can view own project change orders" ON public.change_orders
  FOR SELECT USING (
    project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can manage own project change orders" ON public.change_orders;
CREATE POLICY "Users can manage own project change orders" ON public.change_orders
  FOR ALL USING (
    project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  );

-- 3. Table des rapports journaliers (Daily Reports)
CREATE TABLE IF NOT EXISTS public.daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  weather_condition VARCHAR(50),
  temperature_high INTEGER,
  temperature_low INTEGER,
  wind_speed INTEGER,
  precipitation VARCHAR(50),
  work_performed TEXT NOT NULL,
  workers_on_site INTEGER DEFAULT 0,
  visitors TEXT,
  equipment_used TEXT,
  materials_delivered TEXT,
  delays_issues TEXT,
  safety_incidents TEXT,
  photos JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, date)
);

-- Index pour daily_reports
CREATE INDEX IF NOT EXISTS idx_daily_reports_project ON public.daily_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_daily_reports_date ON public.daily_reports(date DESC);

-- RLS pour daily_reports
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own project daily reports" ON public.daily_reports;
CREATE POLICY "Users can view own project daily reports" ON public.daily_reports
  FOR SELECT USING (
    project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can manage own project daily reports" ON public.daily_reports;
CREATE POLICY "Users can manage own project daily reports" ON public.daily_reports
  FOR ALL USING (
    project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  );

-- 4. Table des RFIs (Request for Information)
CREATE TABLE IF NOT EXISTS public.rfis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  number VARCHAR(50) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  question TEXT NOT NULL,
  answer TEXT,
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'answered', 'closed')),
  priority VARCHAR(50) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  assigned_to VARCHAR(255),
  requested_by VARCHAR(255),
  date_requested TIMESTAMPTZ DEFAULT NOW(),
  date_required TIMESTAMPTZ,
  date_answered TIMESTAMPTZ,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour rfis
CREATE INDEX IF NOT EXISTS idx_rfis_project ON public.rfis(project_id);
CREATE INDEX IF NOT EXISTS idx_rfis_status ON public.rfis(status);

-- RLS pour rfis
ALTER TABLE public.rfis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own project rfis" ON public.rfis;
CREATE POLICY "Users can view own project rfis" ON public.rfis
  FOR SELECT USING (
    project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can manage own project rfis" ON public.rfis;
CREATE POLICY "Users can manage own project rfis" ON public.rfis
  FOR ALL USING (
    project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  );

-- 5. Table des problèmes/issues
CREATE TABLE IF NOT EXISTS public.project_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  number VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority VARCHAR(50) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  category VARCHAR(100),
  assigned_to VARCHAR(255),
  reported_by VARCHAR(255),
  date_reported TIMESTAMPTZ DEFAULT NOW(),
  date_resolved TIMESTAMPTZ,
  resolution TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour project_issues
CREATE INDEX IF NOT EXISTS idx_project_issues_project ON public.project_issues(project_id);
CREATE INDEX IF NOT EXISTS idx_project_issues_status ON public.project_issues(status);

-- RLS pour project_issues
ALTER TABLE public.project_issues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own project issues" ON public.project_issues;
CREATE POLICY "Users can view own project issues" ON public.project_issues
  FOR SELECT USING (
    project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can manage own project issues" ON public.project_issues;
CREATE POLICY "Users can manage own project issues" ON public.project_issues
  FOR ALL USING (
    project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  );

-- 6. Table des photos de projet
CREATE TABLE IF NOT EXISTS public.project_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  daily_report_id UUID REFERENCES public.daily_reports(id) ON DELETE SET NULL,
  filename VARCHAR(255) NOT NULL,
  storage_path TEXT NOT NULL,
  file_url TEXT,
  file_size INTEGER,
  description TEXT,
  location VARCHAR(255),
  taken_at TIMESTAMPTZ,
  tags JSONB DEFAULT '[]'::jsonb,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour project_photos
CREATE INDEX IF NOT EXISTS idx_project_photos_project ON public.project_photos(project_id);
CREATE INDEX IF NOT EXISTS idx_project_photos_daily_report ON public.project_photos(daily_report_id);

-- RLS pour project_photos
ALTER TABLE public.project_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own project photos" ON public.project_photos;
CREATE POLICY "Users can view own project photos" ON public.project_photos
  FOR SELECT USING (
    project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can manage own project photos" ON public.project_photos;
CREATE POLICY "Users can manage own project photos" ON public.project_photos
  FOR ALL USING (
    project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  );

-- 7. Bucket storage pour photos de projet
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-photos', 'project-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Policies pour le storage des photos
DROP POLICY IF EXISTS "Users can upload project photos" ON storage.objects;
CREATE POLICY "Users can upload project photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'project-photos' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can view project photos" ON storage.objects;
CREATE POLICY "Users can view project photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'project-photos');

DROP POLICY IF EXISTS "Users can delete project photos" ON storage.objects;
CREATE POLICY "Users can delete project photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'project-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 8. Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
DROP TRIGGER IF EXISTS update_budget_lines_updated_at ON public.budget_lines;
CREATE TRIGGER update_budget_lines_updated_at
  BEFORE UPDATE ON public.budget_lines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_change_orders_updated_at ON public.change_orders;
CREATE TRIGGER update_change_orders_updated_at
  BEFORE UPDATE ON public.change_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_daily_reports_updated_at ON public.daily_reports;
CREATE TRIGGER update_daily_reports_updated_at
  BEFORE UPDATE ON public.daily_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rfis_updated_at ON public.rfis;
CREATE TRIGGER update_rfis_updated_at
  BEFORE UPDATE ON public.rfis
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_project_issues_updated_at ON public.project_issues;
CREATE TRIGGER update_project_issues_updated_at
  BEFORE UPDATE ON public.project_issues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Vérification
SELECT 'Tables créées:' AS message;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('budget_lines', 'change_orders', 'daily_reports', 'rfis', 'project_issues', 'project_photos')
ORDER BY table_name;
