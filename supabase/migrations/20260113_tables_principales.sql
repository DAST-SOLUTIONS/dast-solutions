-- Migration: Tables principales DAST Solutions
-- Description: Création des tables pour données réelles

-- =============================================
-- PROJETS
-- =============================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  client_id UUID,
  client_name VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  region VARCHAR(100),
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'on_hold', 'cancelled')),
  type VARCHAR(100),
  sector VARCHAR(100),
  budget DECIMAL(15,2),
  budget_revised DECIMAL(15,2),
  start_date DATE,
  end_date DATE,
  progress INTEGER DEFAULT 0,
  manager VARCHAR(255),
  team_size INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TAKEOFFS
-- =============================================
CREATE TABLE IF NOT EXISTS takeoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  plan_url TEXT,
  scale VARCHAR(50),
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed', 'validated')),
  elements JSONB DEFAULT '[]'::jsonb,
  total_items INTEGER DEFAULT 0,
  total_area DECIMAL(15,2),
  total_length DECIMAL(15,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ESTIMATIONS
-- =============================================
CREATE TABLE IF NOT EXISTS estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  version INTEGER DEFAULT 1,
  status VARCHAR(50) DEFAULT 'draft',
  sections JSONB DEFAULT '[]'::jsonb,
  subtotal DECIMAL(15,2) DEFAULT 0,
  contingency_percent DECIMAL(5,2),
  contingency_amount DECIMAL(15,2),
  profit_percent DECIMAL(5,2),
  profit_amount DECIMAL(15,2),
  taxes_tps DECIMAL(15,2),
  taxes_tvq DECIMAL(15,2),
  total DECIMAL(15,2) DEFAULT 0,
  valid_until DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- FACTURES
-- =============================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  client_id UUID,
  client_name VARCHAR(255) NOT NULL,
  client_address TEXT,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  items JSONB DEFAULT '[]'::jsonb,
  subtotal DECIMAL(15,2) DEFAULT 0,
  taxes_tps DECIMAL(15,2) DEFAULT 0,
  taxes_tvq DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CLIENTS
-- =============================================
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  province VARCHAR(50) DEFAULT 'Québec',
  postal_code VARCHAR(20),
  notes TEXT,
  total_projects INTEGER DEFAULT 0,
  total_revenue DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- FOURNISSEURS
-- =============================================
CREATE TABLE IF NOT EXISTS fournisseurs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  category VARCHAR(100),
  specialties TEXT[],
  rating DECIMAL(3,2),
  rbq_license VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ÉQUIPE
-- =============================================
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  role VARCHAR(100),
  department VARCHAR(100),
  hourly_rate DECIMAL(10,2),
  ccq_trade VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- RAPPORTS TERRAIN
-- =============================================
CREATE TABLE IF NOT EXISTS field_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  weather VARCHAR(100),
  temperature DECIMAL(5,2),
  workers_count INTEGER,
  work_performed TEXT NOT NULL,
  materials_used TEXT,
  equipment_used TEXT,
  visitors TEXT,
  safety_issues TEXT,
  delays TEXT,
  photos TEXT[],
  signature TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SEAO - APPELS D'OFFRES
-- =============================================
CREATE TABLE IF NOT EXISTS seao_appels_offres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_seao VARCHAR(50) UNIQUE NOT NULL,
  titre TEXT NOT NULL,
  organisme VARCHAR(255),
  type VARCHAR(50),
  categorie VARCHAR(100),
  region VARCHAR(100),
  date_publication DATE,
  date_ouverture DATE,
  date_fermeture DATE NOT NULL,
  estimation_budget DECIMAL(15,2),
  description TEXT,
  statut VARCHAR(50) DEFAULT 'ouvert',
  url_seao TEXT,
  documents JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CCQ - TAUX HORAIRES
-- =============================================
CREATE TABLE IF NOT EXISTS ccq_taux_horaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_metier VARCHAR(10) NOT NULL,
  metier VARCHAR(255) NOT NULL,
  secteur VARCHAR(50) NOT NULL,
  classe VARCHAR(50) NOT NULL,
  taux_base DECIMAL(10,2) NOT NULL,
  vacances DECIMAL(10,2),
  conges_payes DECIMAL(10,2),
  avantages_sociaux DECIMAL(10,2),
  assurances DECIMAL(10,2),
  retraite DECIMAL(10,2),
  formation DECIMAL(10,2),
  taux_total DECIMAL(10,2) NOT NULL,
  date_effective DATE NOT NULL,
  date_fin DATE,
  UNIQUE(code_metier, secteur, classe)
);

-- =============================================
-- NOTIFICATIONS
-- =============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) DEFAULT 'info',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ACTIVITÉS
-- =============================================
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PUSH SUBSCRIPTIONS
-- =============================================
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  subscription TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_takeoffs_project_id ON takeoffs(project_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_seao_date_fermeture ON seao_appels_offres(date_fermeture);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_activities_user_created ON activities(user_id, created_at DESC);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE takeoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE fournisseurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies (user can only access their own data)
CREATE POLICY "Users can access their own projects" ON projects FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can access their own takeoffs" ON takeoffs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can access their own estimates" ON estimates FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can access their own invoices" ON invoices FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can access their own clients" ON clients FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can access their own fournisseurs" ON fournisseurs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can access their own team" ON team_members FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can access their own reports" ON field_reports FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can access their own notifications" ON notifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can access their own activities" ON activities FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can access their own subscriptions" ON push_subscriptions FOR ALL USING (auth.uid() = user_id);

-- SEAO et CCQ sont accessibles à tous les utilisateurs authentifiés
CREATE POLICY "Authenticated users can read SEAO" ON seao_appels_offres FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read CCQ" ON ccq_taux_horaires FOR SELECT USING (auth.role() = 'authenticated');
