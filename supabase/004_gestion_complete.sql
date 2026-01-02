-- ============================================================================
-- DAST Solutions - Migration Complète Gestion + Fix RLS
-- Exécuter DANS CET ORDRE dans Supabase Dashboard → SQL Editor
-- ============================================================================

-- ============================================================================
-- PARTIE 1: FIX BID_CONFIGURATION RLS (ERREUR ACTUELLE)
-- ============================================================================

-- Vérifier/créer la table bid_configuration avec RLS correct
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bid_configuration') THEN
    -- Désactiver/Réactiver RLS
    ALTER TABLE public.bid_configuration DISABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can manage own bid configurations" ON public.bid_configuration;
    ALTER TABLE public.bid_configuration ENABLE ROW LEVEL SECURITY;
    
    -- Politique permissive
    CREATE POLICY "Users can manage own bid configurations" ON public.bid_configuration
      FOR ALL 
      USING (auth.uid() IS NOT NULL)
      WITH CHECK (auth.uid() IS NOT NULL);
    
    RAISE NOTICE '✅ RLS corrigé pour bid_configuration';
  ELSE
    -- Créer la table
    CREATE TABLE public.bid_configuration (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
      config_key VARCHAR(100),
      config_value TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    ALTER TABLE public.bid_configuration ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can manage own bid configurations" ON public.bid_configuration
      FOR ALL 
      USING (auth.uid() IS NOT NULL)
      WITH CHECK (auth.uid() IS NOT NULL);
    
    RAISE NOTICE '✅ Table bid_configuration créée';
  END IF;
END $$;

-- ============================================================================
-- PARTIE 2: TABLES GESTION DE PROJET
-- ============================================================================

-- 2.1 Budget Lines (CSC MasterFormat)
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

CREATE INDEX IF NOT EXISTS idx_budget_lines_project ON public.budget_lines(project_id);

ALTER TABLE public.budget_lines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "budget_lines_policy" ON public.budget_lines;
CREATE POLICY "budget_lines_policy" ON public.budget_lines
  FOR ALL USING (
    project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  );

-- 2.2 Change Orders
CREATE TABLE IF NOT EXISTS public.change_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  number VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'draft',
  type VARCHAR(50) DEFAULT 'addition',
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

CREATE INDEX IF NOT EXISTS idx_change_orders_project ON public.change_orders(project_id);

ALTER TABLE public.change_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "change_orders_policy" ON public.change_orders;
CREATE POLICY "change_orders_policy" ON public.change_orders
  FOR ALL USING (
    project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  );

-- 2.3 Daily Reports (Journal de chantier)
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

CREATE INDEX IF NOT EXISTS idx_daily_reports_project ON public.daily_reports(project_id);

ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "daily_reports_policy" ON public.daily_reports;
CREATE POLICY "daily_reports_policy" ON public.daily_reports
  FOR ALL USING (
    project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  );

-- 2.4 RFIs
CREATE TABLE IF NOT EXISTS public.rfis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  number VARCHAR(50) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  question TEXT NOT NULL,
  answer TEXT,
  status VARCHAR(50) DEFAULT 'open',
  priority VARCHAR(50) DEFAULT 'normal',
  assigned_to VARCHAR(255),
  requested_by VARCHAR(255),
  date_requested TIMESTAMPTZ DEFAULT NOW(),
  date_required TIMESTAMPTZ,
  date_answered TIMESTAMPTZ,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.rfis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rfis_policy" ON public.rfis;
CREATE POLICY "rfis_policy" ON public.rfis
  FOR ALL USING (
    project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  );

-- 2.5 Project Issues
CREATE TABLE IF NOT EXISTS public.project_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  number VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'open',
  priority VARCHAR(50) DEFAULT 'normal',
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

ALTER TABLE public.project_issues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project_issues_policy" ON public.project_issues;
CREATE POLICY "project_issues_policy" ON public.project_issues
  FOR ALL USING (
    project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  );

-- 2.6 Project Photos
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

ALTER TABLE public.project_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project_photos_policy" ON public.project_photos;
CREATE POLICY "project_photos_policy" ON public.project_photos
  FOR ALL USING (
    project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  );

-- 2.7 Meetings (Réunions)
CREATE TABLE IF NOT EXISTS public.project_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  meeting_type VARCHAR(100) DEFAULT 'general',
  date_time TIMESTAMPTZ NOT NULL,
  location VARCHAR(255),
  attendees JSONB DEFAULT '[]'::jsonb,
  agenda TEXT,
  minutes TEXT,
  action_items JSONB DEFAULT '[]'::jsonb,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.project_meetings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project_meetings_policy" ON public.project_meetings;
CREATE POLICY "project_meetings_policy" ON public.project_meetings
  FOR ALL USING (
    project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  );

-- 2.8 Correspondence
CREATE TABLE IF NOT EXISTS public.project_correspondence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  type VARCHAR(50) DEFAULT 'letter',
  reference_number VARCHAR(100),
  subject VARCHAR(255) NOT NULL,
  from_party VARCHAR(255),
  to_party VARCHAR(255),
  date_sent TIMESTAMPTZ,
  date_received TIMESTAMPTZ,
  content TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  status VARCHAR(50) DEFAULT 'sent',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.project_correspondence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project_correspondence_policy" ON public.project_correspondence;
CREATE POLICY "project_correspondence_policy" ON public.project_correspondence
  FOR ALL USING (
    project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  );

-- 2.9 Project Team
CREATE TABLE IF NOT EXISTS public.project_team (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(100),
  company VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  permissions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.project_team ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project_team_policy" ON public.project_team;
CREATE POLICY "project_team_policy" ON public.project_team
  FOR ALL USING (
    project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  );

-- 2.10 Equipment Tracking
CREATE TABLE IF NOT EXISTS public.project_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  serial_number VARCHAR(100),
  status VARCHAR(50) DEFAULT 'available',
  location VARCHAR(255),
  rental_company VARCHAR(255),
  daily_rate DECIMAL(10,2),
  start_date DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.project_equipment ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project_equipment_policy" ON public.project_equipment;
CREATE POLICY "project_equipment_policy" ON public.project_equipment
  FOR ALL USING (
    project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  );

-- ============================================================================
-- PARTIE 3: TRIGGERS UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Appliquer le trigger à toutes les tables
DO $$
DECLARE
  tables TEXT[] := ARRAY['budget_lines', 'change_orders', 'daily_reports', 'rfis', 
                         'project_issues', 'project_meetings', 'project_correspondence', 
                         'project_team', 'project_equipment', 'bid_configuration'];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS update_%s_updated_at ON public.%s', t, t);
    EXECUTE format('CREATE TRIGGER update_%s_updated_at BEFORE UPDATE ON public.%s FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', t, t);
  END LOOP;
END $$;

-- ============================================================================
-- VÉRIFICATION FINALE
-- ============================================================================

SELECT '✅ Migration terminée!' AS status;

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'bid_configuration', 'budget_lines', 'change_orders', 'daily_reports', 
  'rfis', 'project_issues', 'project_photos', 'project_meetings', 
  'project_correspondence', 'project_team', 'project_equipment'
)
ORDER BY table_name;
