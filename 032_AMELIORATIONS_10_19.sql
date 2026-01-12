-- ============================================================
-- DAST Solutions - Améliorations #10 à #19
-- Toutes les tables pour les 10 modules
-- ============================================================

-- ============================================================
-- #10 - GESTION DES ÉQUIPES
-- ============================================================

CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  team_lead_id UUID,
  color VARCHAR(7) DEFAULT '#3B82F6',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  personnel_id UUID,
  role VARCHAR(50) DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS timesheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  personnel_id UUID,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  work_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  break_minutes INTEGER DEFAULT 0,
  hours_regular DECIMAL(4,2) DEFAULT 0,
  hours_overtime DECIMAL(4,2) DEFAULT 0,
  hours_double DECIMAL(4,2) DEFAULT 0,
  hourly_rate DECIMAL(10,2),
  task_description TEXT,
  status VARCHAR(20) DEFAULT 'draft',
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS timesheet_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'open',
  total_hours DECIMAL(6,2) DEFAULT 0,
  total_amount DECIMAL(12,2) DEFAULT 0,
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID
);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheet_periods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "teams_policy" ON teams;
CREATE POLICY "teams_policy" ON teams FOR ALL USING (user_id = auth.uid());
DROP POLICY IF EXISTS "team_members_policy" ON team_members;
CREATE POLICY "team_members_policy" ON team_members FOR ALL USING (user_id = auth.uid());
DROP POLICY IF EXISTS "timesheets_policy" ON timesheets;
CREATE POLICY "timesheets_policy" ON timesheets FOR ALL USING (user_id = auth.uid());
DROP POLICY IF EXISTS "timesheet_periods_policy" ON timesheet_periods;
CREATE POLICY "timesheet_periods_policy" ON timesheet_periods FOR ALL USING (user_id = auth.uid());


-- ============================================================
-- #12 - NOTIFICATIONS PUSH
-- ============================================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh_key TEXT,
  auth_key TEXT,
  device_type VARCHAR(50),
  device_name VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  body TEXT,
  data JSONB,
  icon VARCHAR(200),
  url VARCHAR(500),
  priority VARCHAR(20) DEFAULT 'normal',
  status VARCHAR(20) DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  email_enabled BOOLEAN DEFAULT TRUE,
  push_enabled BOOLEAN DEFAULT TRUE,
  sms_enabled BOOLEAN DEFAULT FALSE,
  in_app_enabled BOOLEAN DEFAULT TRUE,
  UNIQUE(user_id, category)
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "push_subscriptions_policy" ON push_subscriptions;
CREATE POLICY "push_subscriptions_policy" ON push_subscriptions FOR ALL USING (user_id = auth.uid());
DROP POLICY IF EXISTS "notification_queue_policy" ON notification_queue;
CREATE POLICY "notification_queue_policy" ON notification_queue FOR ALL USING (user_id = auth.uid());
DROP POLICY IF EXISTS "notification_preferences_policy" ON notification_preferences;
CREATE POLICY "notification_preferences_policy" ON notification_preferences FOR ALL USING (user_id = auth.uid());


-- ============================================================
-- #13 - MODULE CRM
-- ============================================================

CREATE TABLE IF NOT EXISTS crm_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_type VARCHAR(30) DEFAULT 'prospect',
  company_name VARCHAR(200),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  title VARCHAR(100),
  email VARCHAR(200),
  phone VARCHAR(50),
  phone_mobile VARCHAR(50),
  address VARCHAR(300),
  city VARCHAR(100),
  province VARCHAR(50) DEFAULT 'QC',
  postal_code VARCHAR(20),
  source VARCHAR(50),
  status VARCHAR(30) DEFAULT 'active',
  lead_score INTEGER DEFAULT 0,
  assigned_to UUID,
  tags TEXT[],
  notes TEXT,
  last_contact_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  industry VARCHAR(100),
  website VARCHAR(200),
  phone VARCHAR(50),
  email VARCHAR(200),
  address VARCHAR(300),
  city VARCHAR(100),
  province VARCHAR(50) DEFAULT 'QC',
  postal_code VARCHAR(20),
  employee_count VARCHAR(50),
  annual_revenue VARCHAR(50),
  status VARCHAR(30) DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,
  company_id UUID REFERENCES crm_companies(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  stage VARCHAR(50) DEFAULT 'qualification',
  probability INTEGER DEFAULT 10,
  value DECIMAL(15,2),
  expected_close_date DATE,
  actual_close_date DATE,
  won BOOLEAN,
  loss_reason VARCHAR(200),
  assigned_to UUID,
  source VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE CASCADE,
  company_id UUID REFERENCES crm_companies(id) ON DELETE SET NULL,
  opportunity_id UUID REFERENCES crm_opportunities(id) ON DELETE SET NULL,
  activity_type VARCHAR(50) NOT NULL,
  subject VARCHAR(200) NOT NULL,
  description TEXT,
  activity_date TIMESTAMPTZ DEFAULT NOW(),
  duration_minutes INTEGER,
  outcome VARCHAR(100),
  next_action VARCHAR(200),
  next_action_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  stages JSONB DEFAULT '[]',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_pipelines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "crm_contacts_policy" ON crm_contacts;
CREATE POLICY "crm_contacts_policy" ON crm_contacts FOR ALL USING (user_id = auth.uid());
DROP POLICY IF EXISTS "crm_companies_policy" ON crm_companies;
CREATE POLICY "crm_companies_policy" ON crm_companies FOR ALL USING (user_id = auth.uid());
DROP POLICY IF EXISTS "crm_opportunities_policy" ON crm_opportunities;
CREATE POLICY "crm_opportunities_policy" ON crm_opportunities FOR ALL USING (user_id = auth.uid());
DROP POLICY IF EXISTS "crm_activities_policy" ON crm_activities;
CREATE POLICY "crm_activities_policy" ON crm_activities FOR ALL USING (user_id = auth.uid());
DROP POLICY IF EXISTS "crm_pipelines_policy" ON crm_pipelines;
CREATE POLICY "crm_pipelines_policy" ON crm_pipelines FOR ALL USING (user_id = auth.uid());


-- ============================================================
-- #14 - MODULE FACTURATION
-- ============================================================

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  client_id UUID,
  invoice_number VARCHAR(50) NOT NULL,
  invoice_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  status VARCHAR(30) DEFAULT 'draft',
  subtotal DECIMAL(15,2) DEFAULT 0,
  tax_tps DECIMAL(10,2) DEFAULT 0,
  tax_tvq DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(15,2) DEFAULT 0,
  amount_paid DECIMAL(15,2) DEFAULT 0,
  balance_due DECIMAL(15,2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'CAD',
  notes TEXT,
  terms TEXT,
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) DEFAULT 1,
  unit VARCHAR(30),
  unit_price DECIMAL(15,2) NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  tax_tps BOOLEAN DEFAULT TRUE,
  tax_tvq BOOLEAN DEFAULT TRUE,
  total DECIMAL(15,2),
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  payment_date DATE DEFAULT CURRENT_DATE,
  amount DECIMAL(15,2) NOT NULL,
  payment_method VARCHAR(50),
  reference_number VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  days INTEGER NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  discount_days INTEGER,
  is_default BOOLEAN DEFAULT FALSE
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_terms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invoices_policy" ON invoices;
CREATE POLICY "invoices_policy" ON invoices FOR ALL USING (user_id = auth.uid());
DROP POLICY IF EXISTS "invoice_items_policy" ON invoice_items;
CREATE POLICY "invoice_items_policy" ON invoice_items FOR ALL USING (user_id = auth.uid());
DROP POLICY IF EXISTS "payments_policy" ON payments;
CREATE POLICY "payments_policy" ON payments FOR ALL USING (user_id = auth.uid());
DROP POLICY IF EXISTS "payment_terms_policy" ON payment_terms;
CREATE POLICY "payment_terms_policy" ON payment_terms FOR ALL USING (user_id = auth.uid());


-- ============================================================
-- #15 - SYNC TAKEOFF → SOUMISSION
-- ============================================================

CREATE TABLE IF NOT EXISTS takeoff_to_quote_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  takeoff_item_id UUID,
  quote_item_id UUID,
  measurement_type VARCHAR(50),
  conversion_factor DECIMAL(10,4) DEFAULT 1,
  material_cost_per_unit DECIMAL(15,4),
  labor_hours_per_unit DECIMAL(10,4),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quote_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  items JSONB DEFAULT '[]',
  markup_percent DECIMAL(5,2) DEFAULT 15,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auto_quote_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  measurement_type VARCHAR(50),
  layer_pattern VARCHAR(200),
  material_id UUID,
  unit_cost DECIMAL(15,4),
  labor_rate DECIMAL(10,2),
  labor_hours_factor DECIMAL(10,4),
  overhead_percent DECIMAL(5,2) DEFAULT 10,
  profit_percent DECIMAL(5,2) DEFAULT 15,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE takeoff_to_quote_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_quote_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "takeoff_mappings_policy" ON takeoff_to_quote_mappings;
CREATE POLICY "takeoff_mappings_policy" ON takeoff_to_quote_mappings FOR ALL USING (user_id = auth.uid());
DROP POLICY IF EXISTS "quote_templates_policy" ON quote_templates;
CREATE POLICY "quote_templates_policy" ON quote_templates FOR ALL USING (user_id = auth.uid());
DROP POLICY IF EXISTS "auto_quote_rules_policy" ON auto_quote_rules;
CREATE POLICY "auto_quote_rules_policy" ON auto_quote_rules FOR ALL USING (user_id = auth.uid());


-- ============================================================
-- #16 - RAPPORTS TERRAIN
-- ============================================================

CREATE TABLE IF NOT EXISTS field_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  report_number VARCHAR(50),
  report_date DATE DEFAULT CURRENT_DATE,
  report_type VARCHAR(50) DEFAULT 'daily',
  weather VARCHAR(100),
  temperature DECIMAL(4,1),
  wind VARCHAR(50),
  precipitation VARCHAR(50),
  workers_on_site INTEGER DEFAULT 0,
  visitors TEXT,
  work_performed TEXT,
  materials_received TEXT,
  equipment_on_site TEXT,
  delays_issues TEXT,
  safety_incidents TEXT,
  quality_observations TEXT,
  photos_count INTEGER DEFAULT 0,
  status VARCHAR(30) DEFAULT 'draft',
  submitted_by VARCHAR(100),
  submitted_at TIMESTAMPTZ,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS field_report_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_id UUID REFERENCES field_reports(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name VARCHAR(200),
  caption TEXT,
  category VARCHAR(50),
  taken_at TIMESTAMPTZ,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS safety_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  inspection_date DATE DEFAULT CURRENT_DATE,
  inspector_name VARCHAR(100),
  inspection_type VARCHAR(50),
  checklist JSONB DEFAULT '[]',
  overall_rating VARCHAR(20),
  deficiencies_found INTEGER DEFAULT 0,
  corrective_actions TEXT,
  follow_up_date DATE,
  status VARCHAR(30) DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE field_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_report_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_inspections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "field_reports_policy" ON field_reports;
CREATE POLICY "field_reports_policy" ON field_reports FOR ALL USING (user_id = auth.uid());
DROP POLICY IF EXISTS "field_report_photos_policy" ON field_report_photos;
CREATE POLICY "field_report_photos_policy" ON field_report_photos FOR ALL USING (user_id = auth.uid());
DROP POLICY IF EXISTS "safety_inspections_policy" ON safety_inspections;
CREATE POLICY "safety_inspections_policy" ON safety_inspections FOR ALL USING (user_id = auth.uid());


-- ============================================================
-- #17 - MESSAGERIE INTÉGRÉE
-- ============================================================

CREATE TABLE IF NOT EXISTS chat_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  channel_type VARCHAR(30) DEFAULT 'project',
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  is_private BOOLEAN DEFAULT FALSE,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES chat_channels(id) ON DELETE CASCADE,
  sender_name VARCHAR(100),
  message TEXT NOT NULL,
  message_type VARCHAR(30) DEFAULT 'text',
  attachments JSONB,
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMPTZ,
  reply_to_id UUID REFERENCES chat_messages(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES chat_channels(id) ON DELETE CASCADE,
  participant_user_id UUID,
  participant_name VARCHAR(100),
  role VARCHAR(30) DEFAULT 'member',
  last_read_at TIMESTAMPTZ,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
  emoji VARCHAR(10) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_channels_policy" ON chat_channels;
CREATE POLICY "chat_channels_policy" ON chat_channels FOR ALL USING (user_id = auth.uid());
DROP POLICY IF EXISTS "chat_messages_policy" ON chat_messages;
CREATE POLICY "chat_messages_policy" ON chat_messages FOR ALL USING (user_id = auth.uid());
DROP POLICY IF EXISTS "chat_participants_policy" ON chat_participants;
CREATE POLICY "chat_participants_policy" ON chat_participants FOR ALL USING (user_id = auth.uid());
DROP POLICY IF EXISTS "chat_reactions_policy" ON chat_reactions;
CREATE POLICY "chat_reactions_policy" ON chat_reactions FOR ALL USING (user_id = auth.uid());


-- ============================================================
-- #18 - GÉOLOCALISATION
-- ============================================================

CREATE TABLE IF NOT EXISTS project_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(200),
  address VARCHAR(300),
  city VARCHAR(100),
  province VARCHAR(50),
  postal_code VARCHAR(20),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  location_type VARCHAR(50) DEFAULT 'main',
  geofence_radius INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS location_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  location_id UUID REFERENCES project_locations(id) ON DELETE SET NULL,
  personnel_id UUID,
  checkin_type VARCHAR(20) NOT NULL,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  accuracy DECIMAL(10,2),
  address VARCHAR(300),
  device_info VARCHAR(200),
  photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS geofence_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  location_id UUID REFERENCES project_locations(id) ON DELETE CASCADE,
  personnel_id UUID,
  event_type VARCHAR(20) NOT NULL,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE project_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE geofence_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project_locations_policy" ON project_locations;
CREATE POLICY "project_locations_policy" ON project_locations FOR ALL USING (user_id = auth.uid());
DROP POLICY IF EXISTS "location_checkins_policy" ON location_checkins;
CREATE POLICY "location_checkins_policy" ON location_checkins FOR ALL USING (user_id = auth.uid());
DROP POLICY IF EXISTS "geofence_events_policy" ON geofence_events;
CREATE POLICY "geofence_events_policy" ON geofence_events FOR ALL USING (user_id = auth.uid());


-- ============================================================
-- #19 - AI RECONNAISSANCE PLANS
-- ============================================================

CREATE TABLE IF NOT EXISTS ai_extraction_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  document_id UUID,
  file_name VARCHAR(200),
  file_url TEXT,
  job_type VARCHAR(50) NOT NULL,
  status VARCHAR(30) DEFAULT 'pending',
  progress INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  results JSONB,
  confidence_score DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_extracted_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES ai_extraction_jobs(id) ON DELETE CASCADE,
  item_type VARCHAR(50),
  description TEXT,
  quantity DECIMAL(15,4),
  unit VARCHAR(30),
  confidence DECIMAL(5,2),
  bounding_box JSONB,
  page_number INTEGER,
  source_text TEXT,
  validated BOOLEAN DEFAULT FALSE,
  validated_by UUID,
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_training_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category VARCHAR(100),
  input_text TEXT,
  expected_output JSONB,
  feedback_rating INTEGER,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ocr_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID,
  page_number INTEGER,
  raw_text TEXT,
  structured_data JSONB,
  language VARCHAR(10) DEFAULT 'fr',
  confidence DECIMAL(5,2),
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ai_extraction_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_extracted_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_training_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocr_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_extraction_jobs_policy" ON ai_extraction_jobs;
CREATE POLICY "ai_extraction_jobs_policy" ON ai_extraction_jobs FOR ALL USING (user_id = auth.uid());
DROP POLICY IF EXISTS "ai_extracted_items_policy" ON ai_extracted_items;
CREATE POLICY "ai_extracted_items_policy" ON ai_extracted_items FOR ALL USING (user_id = auth.uid());
DROP POLICY IF EXISTS "ai_training_data_policy" ON ai_training_data;
CREATE POLICY "ai_training_data_policy" ON ai_training_data FOR ALL USING (user_id = auth.uid());
DROP POLICY IF EXISTS "ocr_results_policy" ON ocr_results;
CREATE POLICY "ocr_results_policy" ON ocr_results FOR ALL USING (user_id = auth.uid());


-- ============================================================
-- INDEX POUR PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_timesheets_date ON timesheets(work_date);
CREATE INDEX IF NOT EXISTS idx_timesheets_project ON timesheets(project_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_type ON crm_contacts(contact_type);
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_stage ON crm_opportunities(stage);
CREATE INDEX IF NOT EXISTS idx_field_reports_date ON field_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel ON chat_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_location_checkins_date ON location_checkins(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_status ON ai_extraction_jobs(status);


-- ============================================================
-- DONNÉES INITIALES
-- ============================================================

-- Pipeline CRM par défaut
INSERT INTO crm_pipelines (user_id, name, stages, is_default)
SELECT auth.uid(), 'Pipeline Principal', 
  '[{"name":"Qualification","color":"#6B7280"},{"name":"Rencontre","color":"#3B82F6"},{"name":"Proposition","color":"#F59E0B"},{"name":"Négociation","color":"#8B5CF6"},{"name":"Gagné","color":"#10B981"},{"name":"Perdu","color":"#EF4444"}]'::jsonb,
  TRUE
WHERE auth.uid() IS NOT NULL
ON CONFLICT DO NOTHING;

-- Termes de paiement par défaut
INSERT INTO payment_terms (user_id, name, days, is_default)
SELECT auth.uid(), 'Net 30', 30, TRUE
WHERE auth.uid() IS NOT NULL
ON CONFLICT DO NOTHING;


-- ============================================================
-- FIN - 40+ nouvelles tables créées
-- ============================================================
