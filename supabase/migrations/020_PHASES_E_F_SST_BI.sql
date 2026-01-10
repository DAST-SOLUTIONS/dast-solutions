-- ============================================================
-- DAST Solutions - Phases E et F: SST et Dashboard BI
-- Securite au travail et Business Intelligence
-- ============================================================

-- PARTIE E: SST - SANTE ET SECURITE AU TRAVAIL

-- TABLE SAFETY_INCIDENTS (Incidents de securite)

CREATE TABLE IF NOT EXISTS safety_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  project_id UUID,
  
  incident_number VARCHAR(30) NOT NULL,
  incident_type VARCHAR(30) NOT NULL CHECK (incident_type IN ('accident', 'near_miss', 'first_aid', 'property_damage', 'environmental')),
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('minor', 'moderate', 'serious', 'critical')),
  
  date DATE NOT NULL,
  time TIME,
  location VARCHAR(200),
  
  description TEXT NOT NULL,
  immediate_actions TEXT,
  root_cause TEXT,
  corrective_actions TEXT,
  
  injured_person VARCHAR(200),
  injury_type VARCHAR(100),
  body_part VARCHAR(100),
  treatment TEXT,
  lost_time_days INTEGER DEFAULT 0,
  
  witnesses TEXT[],
  reported_by VARCHAR(200),
  
  status VARCHAR(30) DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'corrective_action', 'closed')),
  
  cnesst_reported BOOLEAN DEFAULT FALSE,
  cnesst_number VARCHAR(50),
  cnesst_report_date DATE,
  
  photos TEXT[] DEFAULT '{}',
  documents TEXT[] DEFAULT '{}',
  
  investigation_notes TEXT,
  closed_date DATE,
  closed_by VARCHAR(200),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_safety_incidents_user ON safety_incidents(user_id);
CREATE INDEX IF NOT EXISTS idx_safety_incidents_project ON safety_incidents(project_id);
CREATE INDEX IF NOT EXISTS idx_safety_incidents_status ON safety_incidents(status);
CREATE INDEX IF NOT EXISTS idx_safety_incidents_date ON safety_incidents(date);
CREATE INDEX IF NOT EXISTS idx_safety_incidents_type ON safety_incidents(incident_type);

ALTER TABLE safety_incidents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own incidents" ON safety_incidents;
CREATE POLICY "Users can manage own incidents" ON safety_incidents
  FOR ALL USING (user_id = auth.uid());


-- TABLE SAFETY_INSPECTIONS (Inspections de securite)

CREATE TABLE IF NOT EXISTS safety_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  project_id UUID,
  
  inspection_number VARCHAR(30) NOT NULL,
  inspection_type VARCHAR(20) NOT NULL CHECK (inspection_type IN ('daily', 'weekly', 'monthly', 'special')),
  
  date DATE NOT NULL,
  inspector_name VARCHAR(200) NOT NULL,
  inspector_certification VARCHAR(100),
  
  checklist_items JSONB DEFAULT '[]',
  
  deficiencies_found INTEGER DEFAULT 0,
  corrective_actions TEXT,
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_date DATE,
  
  overall_rating VARCHAR(20) CHECK (overall_rating IN ('excellent', 'good', 'fair', 'poor')),
  status VARCHAR(30) DEFAULT 'completed' CHECK (status IN ('completed', 'pending_review', 'corrective_required')),
  
  weather_conditions VARCHAR(100),
  temperature INTEGER,
  
  photos TEXT[] DEFAULT '{}',
  signature TEXT,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_safety_inspections_user ON safety_inspections(user_id);
CREATE INDEX IF NOT EXISTS idx_safety_inspections_project ON safety_inspections(project_id);
CREATE INDEX IF NOT EXISTS idx_safety_inspections_date ON safety_inspections(date);
CREATE INDEX IF NOT EXISTS idx_safety_inspections_type ON safety_inspections(inspection_type);

ALTER TABLE safety_inspections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own inspections" ON safety_inspections;
CREATE POLICY "Users can manage own inspections" ON safety_inspections
  FOR ALL USING (user_id = auth.uid());


-- TABLE SAFETY_TRAININGS (Formations securite)

CREATE TABLE IF NOT EXISTS safety_trainings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  
  employee_id UUID,
  employee_name VARCHAR(200) NOT NULL,
  
  training_type VARCHAR(50) NOT NULL,
  training_name VARCHAR(200) NOT NULL,
  provider VARCHAR(200),
  
  completion_date DATE NOT NULL,
  expiry_date DATE,
  
  certificate_number VARCHAR(100),
  certificate_url TEXT,
  
  status VARCHAR(20) DEFAULT 'valid' CHECK (status IN ('valid', 'expiring_soon', 'expired')),
  
  cost DECIMAL(10,2),
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_safety_trainings_user ON safety_trainings(user_id);
CREATE INDEX IF NOT EXISTS idx_safety_trainings_employee ON safety_trainings(employee_id);
CREATE INDEX IF NOT EXISTS idx_safety_trainings_expiry ON safety_trainings(expiry_date);
CREATE INDEX IF NOT EXISTS idx_safety_trainings_status ON safety_trainings(status);

ALTER TABLE safety_trainings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own trainings" ON safety_trainings;
CREATE POLICY "Users can manage own trainings" ON safety_trainings
  FOR ALL USING (user_id = auth.uid());


-- TABLE SAFETY_EQUIPMENT (Equipements de securite)

CREATE TABLE IF NOT EXISTS safety_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  
  equipment_type VARCHAR(100) NOT NULL,
  name VARCHAR(200) NOT NULL,
  serial_number VARCHAR(100),
  manufacturer VARCHAR(200),
  model VARCHAR(100),
  
  purchase_date DATE,
  warranty_expiry DATE,
  
  location VARCHAR(200),
  assigned_to VARCHAR(200),
  
  last_inspection DATE,
  next_inspection DATE,
  inspection_frequency_days INTEGER DEFAULT 365,
  
  status VARCHAR(30) DEFAULT 'active' CHECK (status IN ('active', 'needs_inspection', 'out_of_service', 'retired')),
  
  notes TEXT,
  documents TEXT[] DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_safety_equipment_user ON safety_equipment(user_id);
CREATE INDEX IF NOT EXISTS idx_safety_equipment_status ON safety_equipment(status);
CREATE INDEX IF NOT EXISTS idx_safety_equipment_next_inspection ON safety_equipment(next_inspection);

ALTER TABLE safety_equipment ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own equipment" ON safety_equipment;
CREATE POLICY "Users can manage own equipment" ON safety_equipment
  FOR ALL USING (user_id = auth.uid());


-- TABLE SAFETY_MEETINGS (Reunions securite - toolbox talks)

CREATE TABLE IF NOT EXISTS safety_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  project_id UUID,
  
  meeting_type VARCHAR(50) NOT NULL,
  topic VARCHAR(300) NOT NULL,
  
  date DATE NOT NULL,
  duration_minutes INTEGER,
  
  presenter VARCHAR(200),
  attendees JSONB DEFAULT '[]',
  attendee_count INTEGER DEFAULT 0,
  
  content TEXT,
  discussion_points TEXT,
  action_items TEXT,
  
  documents TEXT[] DEFAULT '{}',
  sign_in_sheet TEXT,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_safety_meetings_user ON safety_meetings(user_id);
CREATE INDEX IF NOT EXISTS idx_safety_meetings_project ON safety_meetings(project_id);
CREATE INDEX IF NOT EXISTS idx_safety_meetings_date ON safety_meetings(date);

ALTER TABLE safety_meetings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own meetings" ON safety_meetings;
CREATE POLICY "Users can manage own meetings" ON safety_meetings
  FOR ALL USING (user_id = auth.uid());


-- PARTIE F: DASHBOARD BI - INDICATEURS ET METRIQUES

-- TABLE BI_KPIS (Indicateurs de performance)

CREATE TABLE IF NOT EXISTS bi_kpis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  
  kpi_name VARCHAR(100) NOT NULL,
  kpi_category VARCHAR(50) NOT NULL,
  
  value DECIMAL(14,2),
  unit VARCHAR(20),
  
  target_value DECIMAL(14,2),
  threshold_warning DECIMAL(14,2),
  threshold_critical DECIMAL(14,2),
  
  period_type VARCHAR(20) CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  period_date DATE,
  
  trend_direction VARCHAR(10) CHECK (trend_direction IN ('up', 'down', 'stable')),
  trend_percentage DECIMAL(5,2),
  
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bi_kpis_user ON bi_kpis(user_id);
CREATE INDEX IF NOT EXISTS idx_bi_kpis_category ON bi_kpis(kpi_category);
CREATE INDEX IF NOT EXISTS idx_bi_kpis_period ON bi_kpis(period_date);

ALTER TABLE bi_kpis ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own kpis" ON bi_kpis;
CREATE POLICY "Users can manage own kpis" ON bi_kpis
  FOR ALL USING (user_id = auth.uid());


-- TABLE BI_REPORTS (Rapports BI sauvegardes)

CREATE TABLE IF NOT EXISTS bi_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  
  report_name VARCHAR(200) NOT NULL,
  report_type VARCHAR(50) NOT NULL,
  
  parameters JSONB DEFAULT '{}',
  filters JSONB DEFAULT '{}',
  
  generated_data JSONB,
  generated_at TIMESTAMPTZ,
  
  is_scheduled BOOLEAN DEFAULT FALSE,
  schedule_frequency VARCHAR(20),
  next_run TIMESTAMPTZ,
  
  recipients TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bi_reports_user ON bi_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_bi_reports_type ON bi_reports(report_type);

ALTER TABLE bi_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own reports" ON bi_reports;
CREATE POLICY "Users can manage own reports" ON bi_reports
  FOR ALL USING (user_id = auth.uid());


-- TABLE BI_DASHBOARDS (Tableaux de bord personnalises)

CREATE TABLE IF NOT EXISTS bi_dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  
  dashboard_name VARCHAR(200) NOT NULL,
  description TEXT,
  
  layout JSONB DEFAULT '{}',
  widgets JSONB DEFAULT '[]',
  
  is_default BOOLEAN DEFAULT FALSE,
  is_shared BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bi_dashboards_user ON bi_dashboards(user_id);

ALTER TABLE bi_dashboards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own dashboards" ON bi_dashboards;
CREATE POLICY "Users can manage own dashboards" ON bi_dashboards
  FOR ALL USING (user_id = auth.uid());


-- VUES SST

CREATE OR REPLACE VIEW v_safety_stats AS
SELECT 
  user_id,
  COUNT(*) FILTER (WHERE status != 'closed') as open_incidents,
  COUNT(*) FILTER (WHERE incident_type = 'accident') as total_accidents,
  COUNT(*) FILTER (WHERE incident_type = 'near_miss') as total_near_misses,
  COALESCE(SUM(lost_time_days), 0) as total_lost_days,
  MAX(date) as last_incident_date
FROM safety_incidents
GROUP BY user_id;


CREATE OR REPLACE VIEW v_training_compliance AS
SELECT 
  user_id,
  COUNT(*) as total_trainings,
  COUNT(*) FILTER (WHERE status = 'valid') as valid_trainings,
  COUNT(*) FILTER (WHERE status = 'expiring_soon') as expiring_soon,
  COUNT(*) FILTER (WHERE status = 'expired') as expired_trainings,
  ROUND(COUNT(*) FILTER (WHERE status = 'valid')::numeric / NULLIF(COUNT(*), 0) * 100, 1) as compliance_rate
FROM safety_trainings
GROUP BY user_id;


-- TRIGGERS

-- Trigger: Mettre a jour le statut des formations
CREATE OR REPLACE FUNCTION update_training_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expiry_date IS NOT NULL THEN
    IF NEW.expiry_date < CURRENT_DATE THEN
      NEW.status = 'expired';
    ELSIF NEW.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN
      NEW.status = 'expiring_soon';
    ELSE
      NEW.status = 'valid';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_training_status ON safety_trainings;
CREATE TRIGGER trigger_update_training_status
  BEFORE INSERT OR UPDATE ON safety_trainings
  FOR EACH ROW EXECUTE FUNCTION update_training_status();


-- Trigger: Mettre a jour le statut des equipements
CREATE OR REPLACE FUNCTION update_equipment_inspection_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.next_inspection IS NOT NULL THEN
    IF NEW.next_inspection < CURRENT_DATE THEN
      NEW.status = 'needs_inspection';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_equipment_status ON safety_equipment;
CREATE TRIGGER trigger_update_equipment_status
  BEFORE INSERT OR UPDATE ON safety_equipment
  FOR EACH ROW EXECUTE FUNCTION update_equipment_inspection_status();


-- Triggers updated_at
DROP TRIGGER IF EXISTS update_safety_incidents_updated_at ON safety_incidents;
CREATE TRIGGER update_safety_incidents_updated_at
  BEFORE UPDATE ON safety_incidents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_safety_trainings_updated_at ON safety_trainings;
CREATE TRIGGER update_safety_trainings_updated_at
  BEFORE UPDATE ON safety_trainings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_safety_equipment_updated_at ON safety_equipment;
CREATE TRIGGER update_safety_equipment_updated_at
  BEFORE UPDATE ON safety_equipment
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- FIN MIGRATION PHASES E ET F
