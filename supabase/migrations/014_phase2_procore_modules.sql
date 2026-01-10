-- ============================================================
-- DAST Solutions - Phase 2: Modules Procore-style
-- Migration SQL pour les nouvelles fonctionnalités
-- Date: 2026-01-10
-- ============================================================

-- ============================================================
-- 1. TABLE RFIs (Demandes d'information)
-- ============================================================

CREATE TABLE IF NOT EXISTS rfis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  rfi_number VARCHAR(20) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  question TEXT NOT NULL,
  response TEXT,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('draft', 'open', 'pending', 'answered', 'closed')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  discipline VARCHAR(100),
  location VARCHAR(255),
  drawing_reference VARCHAR(100),
  spec_reference VARCHAR(100),
  cost_impact BOOLEAN DEFAULT FALSE,
  schedule_impact BOOLEAN DEFAULT FALSE,
  requested_by VARCHAR(255) NOT NULL,
  assigned_to VARCHAR(255),
  due_date DATE,
  responded_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  attachments JSONB DEFAULT '[]'::JSONB,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour RFIs
CREATE INDEX IF NOT EXISTS idx_rfis_project ON rfis(project_id);
CREATE INDEX IF NOT EXISTS idx_rfis_status ON rfis(status);
CREATE INDEX IF NOT EXISTS idx_rfis_number ON rfis(rfi_number);

-- RLS pour RFIs
ALTER TABLE rfis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own project RFIs" ON rfis;
CREATE POLICY "Users can view own project RFIs" ON rfis
  FOR SELECT USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert RFIs" ON rfis;
CREATE POLICY "Users can insert RFIs" ON rfis
  FOR INSERT WITH CHECK (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update own RFIs" ON rfis;
CREATE POLICY "Users can update own RFIs" ON rfis
  FOR UPDATE USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete own RFIs" ON rfis;
CREATE POLICY "Users can delete own RFIs" ON rfis
  FOR DELETE USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );


-- ============================================================
-- 2. TABLE SUBMITTALS (Documents à approuver)
-- ============================================================

CREATE TABLE IF NOT EXISTS submittals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  submittal_number VARCHAR(20) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  spec_section VARCHAR(50),
  status VARCHAR(30) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'approved_as_noted', 'revise_resubmit', 'rejected')),
  revision INTEGER DEFAULT 0,
  submitted_by VARCHAR(255) NOT NULL,
  submitted_date TIMESTAMPTZ,
  due_date DATE,
  reviewed_by VARCHAR(255),
  reviewed_date TIMESTAMPTZ,
  review_comments TEXT,
  discipline VARCHAR(100),
  contractor VARCHAR(255),
  attachments JSONB DEFAULT '[]'::JSONB,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour Submittals
CREATE INDEX IF NOT EXISTS idx_submittals_project ON submittals(project_id);
CREATE INDEX IF NOT EXISTS idx_submittals_status ON submittals(status);
CREATE INDEX IF NOT EXISTS idx_submittals_number ON submittals(submittal_number);

-- RLS pour Submittals
ALTER TABLE submittals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own project submittals" ON submittals;
CREATE POLICY "Users can view own project submittals" ON submittals
  FOR SELECT USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert submittals" ON submittals;
CREATE POLICY "Users can insert submittals" ON submittals
  FOR INSERT WITH CHECK (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update own submittals" ON submittals;
CREATE POLICY "Users can update own submittals" ON submittals
  FOR UPDATE USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete own submittals" ON submittals;
CREATE POLICY "Users can delete own submittals" ON submittals
  FOR DELETE USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );


-- ============================================================
-- 3. TABLE INSPECTIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  inspection_number VARCHAR(20) NOT NULL,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(30) DEFAULT 'quality' CHECK (type IN ('quality', 'safety', 'progress', 'final', 'regulatory', 'pre_pour', 'structural')),
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'passed', 'failed', 'conditional')),
  scheduled_date DATE NOT NULL,
  completed_date TIMESTAMPTZ,
  location VARCHAR(255),
  discipline VARCHAR(100),
  inspector VARCHAR(255) NOT NULL,
  contractor VARCHAR(255),
  checklist_items JSONB DEFAULT '[]'::JSONB,
  findings TEXT,
  corrective_actions TEXT,
  photos JSONB DEFAULT '[]'::JSONB,
  signature TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour Inspections
CREATE INDEX IF NOT EXISTS idx_inspections_project ON inspections(project_id);
CREATE INDEX IF NOT EXISTS idx_inspections_status ON inspections(status);
CREATE INDEX IF NOT EXISTS idx_inspections_date ON inspections(scheduled_date);

-- RLS pour Inspections
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own project inspections" ON inspections;
CREATE POLICY "Users can view own project inspections" ON inspections
  FOR SELECT USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert inspections" ON inspections;
CREATE POLICY "Users can insert inspections" ON inspections
  FOR INSERT WITH CHECK (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update own inspections" ON inspections;
CREATE POLICY "Users can update own inspections" ON inspections
  FOR UPDATE USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete own inspections" ON inspections;
CREATE POLICY "Users can delete own inspections" ON inspections
  FOR DELETE USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );


-- ============================================================
-- 4. TABLE PUNCH_ITEMS (Déficiences)
-- ============================================================

CREATE TABLE IF NOT EXISTS punch_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  punch_number VARCHAR(20) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(30) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'ready_for_review', 'closed', 'rejected')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  category VARCHAR(100),
  location VARCHAR(255),
  discipline VARCHAR(100),
  assigned_to VARCHAR(255),
  contractor VARCHAR(255),
  due_date DATE,
  completed_date TIMESTAMPTZ,
  verified_by VARCHAR(255),
  verified_date TIMESTAMPTZ,
  photos_before JSONB DEFAULT '[]'::JSONB,
  photos_after JSONB DEFAULT '[]'::JSONB,
  notes TEXT,
  created_by VARCHAR(255) NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour Punch Items
CREATE INDEX IF NOT EXISTS idx_punch_items_project ON punch_items(project_id);
CREATE INDEX IF NOT EXISTS idx_punch_items_status ON punch_items(status);
CREATE INDEX IF NOT EXISTS idx_punch_items_location ON punch_items(location);
CREATE INDEX IF NOT EXISTS idx_punch_items_priority ON punch_items(priority);

-- RLS pour Punch Items
ALTER TABLE punch_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own project punch items" ON punch_items;
CREATE POLICY "Users can view own project punch items" ON punch_items
  FOR SELECT USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert punch items" ON punch_items;
CREATE POLICY "Users can insert punch items" ON punch_items
  FOR INSERT WITH CHECK (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update own punch items" ON punch_items;
CREATE POLICY "Users can update own punch items" ON punch_items
  FOR UPDATE USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete own punch items" ON punch_items;
CREATE POLICY "Users can delete own punch items" ON punch_items
  FOR DELETE USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );


-- ============================================================
-- 5. TABLE MEETINGS (Réunions de chantier)
-- ============================================================

CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  meeting_number VARCHAR(20) NOT NULL,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(30) DEFAULT 'chantier' CHECK (type IN ('chantier', 'coordination', 'securite', 'client', 'interne', 'autre')),
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  location VARCHAR(255),
  meeting_type VARCHAR(20) DEFAULT 'in_person' CHECK (meeting_type IN ('in_person', 'video', 'phone')),
  organizer VARCHAR(255) NOT NULL,
  attendees JSONB DEFAULT '[]'::JSONB,
  agenda JSONB DEFAULT '[]'::JSONB,
  action_items JSONB DEFAULT '[]'::JSONB,
  notes TEXT,
  attachments JSONB DEFAULT '[]'::JSONB,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour Meetings
CREATE INDEX IF NOT EXISTS idx_meetings_project ON meetings(project_id);
CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings(date);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);

-- RLS pour Meetings
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own project meetings" ON meetings;
CREATE POLICY "Users can view own project meetings" ON meetings
  FOR SELECT USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert meetings" ON meetings;
CREATE POLICY "Users can insert meetings" ON meetings
  FOR INSERT WITH CHECK (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update own meetings" ON meetings;
CREATE POLICY "Users can update own meetings" ON meetings
  FOR UPDATE USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete own meetings" ON meetings;
CREATE POLICY "Users can delete own meetings" ON meetings
  FOR DELETE USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );


-- ============================================================
-- 6. TABLE DAILY_REPORTS (si pas encore créée)
-- ============================================================

CREATE TABLE IF NOT EXISTS daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  weather_condition VARCHAR(50),
  temperature_high INTEGER,
  temperature_low INTEGER,
  wind_speed INTEGER,
  precipitation VARCHAR(100),
  work_performed TEXT,
  workers_on_site INTEGER DEFAULT 0,
  visitors TEXT,
  equipment_used TEXT,
  materials_delivered TEXT,
  delays_issues TEXT,
  safety_incidents TEXT,
  photos JSONB DEFAULT '[]'::JSONB,
  notes TEXT,
  created_by VARCHAR(255),
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, date)
);

-- Index pour Daily Reports
CREATE INDEX IF NOT EXISTS idx_daily_reports_project ON daily_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_daily_reports_date ON daily_reports(date);

-- RLS pour Daily Reports
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own project daily reports" ON daily_reports;
CREATE POLICY "Users can view own project daily reports" ON daily_reports
  FOR SELECT USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert daily reports" ON daily_reports;
CREATE POLICY "Users can insert daily reports" ON daily_reports
  FOR INSERT WITH CHECK (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update own daily reports" ON daily_reports;
CREATE POLICY "Users can update own daily reports" ON daily_reports
  FOR UPDATE USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete own daily reports" ON daily_reports;
CREATE POLICY "Users can delete own daily reports" ON daily_reports
  FOR DELETE USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );


-- ============================================================
-- 7. TRIGGERS pour updated_at
-- ============================================================

-- Fonction générique pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer aux nouvelles tables
DROP TRIGGER IF EXISTS update_rfis_updated_at ON rfis;
CREATE TRIGGER update_rfis_updated_at
  BEFORE UPDATE ON rfis
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_submittals_updated_at ON submittals;
CREATE TRIGGER update_submittals_updated_at
  BEFORE UPDATE ON submittals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_inspections_updated_at ON inspections;
CREATE TRIGGER update_inspections_updated_at
  BEFORE UPDATE ON inspections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_punch_items_updated_at ON punch_items;
CREATE TRIGGER update_punch_items_updated_at
  BEFORE UPDATE ON punch_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_meetings_updated_at ON meetings;
CREATE TRIGGER update_meetings_updated_at
  BEFORE UPDATE ON meetings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_daily_reports_updated_at ON daily_reports;
CREATE TRIGGER update_daily_reports_updated_at
  BEFORE UPDATE ON daily_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- 8. VUES pour statistiques dashboard
-- ============================================================

-- Vue pour stats RFI par projet
CREATE OR REPLACE VIEW v_project_rfi_stats AS
SELECT 
  project_id,
  COUNT(*) as total_rfis,
  COUNT(*) FILTER (WHERE status = 'open') as open_rfis,
  COUNT(*) FILTER (WHERE status = 'answered') as answered_rfis,
  COUNT(*) FILTER (WHERE status = 'closed') as closed_rfis,
  COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND status NOT IN ('closed', 'answered')) as overdue_rfis
FROM rfis
GROUP BY project_id;

-- Vue pour stats Punch List par projet
CREATE OR REPLACE VIEW v_project_punch_stats AS
SELECT 
  project_id,
  COUNT(*) as total_items,
  COUNT(*) FILTER (WHERE status = 'open') as open_items,
  COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_items,
  COUNT(*) FILTER (WHERE status = 'closed') as closed_items,
  COUNT(*) FILTER (WHERE priority = 'critical' AND status != 'closed') as critical_items,
  ROUND(COUNT(*) FILTER (WHERE status = 'closed')::NUMERIC / NULLIF(COUNT(*), 0) * 100, 1) as completion_percentage
FROM punch_items
GROUP BY project_id;

-- Vue pour stats Inspections par projet
CREATE OR REPLACE VIEW v_project_inspection_stats AS
SELECT 
  project_id,
  COUNT(*) as total_inspections,
  COUNT(*) FILTER (WHERE status = 'scheduled') as scheduled,
  COUNT(*) FILTER (WHERE status = 'passed') as passed,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  COUNT(*) FILTER (WHERE status = 'conditional') as conditional
FROM inspections
GROUP BY project_id;


-- ============================================================
-- FIN DE LA MIGRATION PHASE 2
-- ============================================================

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Migration Phase 2 complétée avec succès!';
  RAISE NOTICE '   - Table rfis créée';
  RAISE NOTICE '   - Table submittals créée';
  RAISE NOTICE '   - Table inspections créée';
  RAISE NOTICE '   - Table punch_items créée';
  RAISE NOTICE '   - Table meetings créée';
  RAISE NOTICE '   - Table daily_reports créée/vérifiée';
  RAISE NOTICE '   - RLS policies appliquées';
  RAISE NOTICE '   - Triggers updated_at configurés';
  RAISE NOTICE '   - Vues statistiques créées';
END $$;
