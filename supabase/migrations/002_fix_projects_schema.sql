-- ============================================================================
-- DAST Solutions - FIX: Ajout colonnes manquantes + RLS complet
-- Exécuter dans Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. AJOUTER LES COLONNES MANQUANTES À PROJECTS
-- ============================================================================

ALTER TABLE public.projects 
  ADD COLUMN IF NOT EXISTS city VARCHAR(255),
  ADD COLUMN IF NOT EXISTS province VARCHAR(50) DEFAULT 'QC',
  ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20),
  ADD COLUMN IF NOT EXISTS budget DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS client_id UUID,
  ADD COLUMN IF NOT EXISTS project_category VARCHAR(100),
  ADD COLUMN IF NOT EXISTS project_scope VARCHAR(50),
  ADD COLUMN IF NOT EXISTS building_type VARCHAR(100),
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- ============================================================================
-- 2. TABLE CLIENTS (CRM)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('individu', 'societe')),
  -- Pour individu
  prenom VARCHAR(100),
  nom VARCHAR(100),
  -- Pour société
  nom_societe VARCHAR(255),
  numero_entreprise VARCHAR(50),
  -- Commun
  email VARCHAR(255),
  telephone VARCHAR(50),
  telephone_mobile VARCHAR(50),
  adresse TEXT,
  ville VARCHAR(100),
  province VARCHAR(50) DEFAULT 'QC',
  code_postal VARCHAR(20),
  notes TEXT,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_type ON public.clients(type);

-- RLS pour clients
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their clients" ON public.clients;
CREATE POLICY "Users can manage their clients" ON public.clients
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- 3. TABLE CONTACTS (liés aux clients)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  prenom VARCHAR(100) NOT NULL,
  nom VARCHAR(100) NOT NULL,
  titre VARCHAR(100),
  email VARCHAR(255),
  telephone VARCHAR(50),
  telephone_mobile VARCHAR(50),
  est_principal BOOLEAN DEFAULT false,
  notes TEXT,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_contacts_client_id ON public.contacts(client_id);
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON public.contacts(user_id);

-- RLS pour contacts
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their contacts" ON public.contacts;
CREATE POLICY "Users can manage their contacts" ON public.contacts
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- 4. TABLE CONTACTS PROJET (liaison projet-contacts)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.project_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  role VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, contact_id)
);

-- RLS
ALTER TABLE public.project_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage project contacts" ON public.project_contacts;
CREATE POLICY "Users can manage project contacts" ON public.project_contacts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND user_id = auth.uid())
  );

-- ============================================================================
-- 5. AJOUTER FK client_id dans projects
-- ============================================================================

ALTER TABLE public.projects 
  DROP CONSTRAINT IF EXISTS fk_projects_client;

ALTER TABLE public.projects 
  ADD CONSTRAINT fk_projects_client 
  FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;

-- ============================================================================
-- 6. ACTIVER RLS SUR TOUTES LES TABLES SIGNALÉES
-- ============================================================================

-- CCQ Tables (lecture publique)
ALTER TABLE public.ccq_sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ccq_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ccq_hourly_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ccq_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ccq_social_benefits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read ccq_sectors" ON public.ccq_sectors;
CREATE POLICY "Public read ccq_sectors" ON public.ccq_sectors FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read ccq_trades" ON public.ccq_trades;
CREATE POLICY "Public read ccq_trades" ON public.ccq_trades FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read ccq_hourly_rates" ON public.ccq_hourly_rates;
CREATE POLICY "Public read ccq_hourly_rates" ON public.ccq_hourly_rates FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read ccq_regions" ON public.ccq_regions;
CREATE POLICY "Public read ccq_regions" ON public.ccq_regions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read ccq_social_benefits" ON public.ccq_social_benefits;
CREATE POLICY "Public read ccq_social_benefits" ON public.ccq_social_benefits FOR SELECT USING (true);

-- Appels d'offres tables (user-specific)
ALTER TABLE public.appels_offres_favoris ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appels_offres_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appels_offres_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appels_offres_soumissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appels_offres_comparatifs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage appels_offres_favoris" ON public.appels_offres_favoris;
CREATE POLICY "Users manage appels_offres_favoris" ON public.appels_offres_favoris
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage appels_offres_notifications" ON public.appels_offres_notifications;
CREATE POLICY "Users manage appels_offres_notifications" ON public.appels_offres_notifications
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage appels_offres_invitations" ON public.appels_offres_invitations;
CREATE POLICY "Users manage appels_offres_invitations" ON public.appels_offres_invitations
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage appels_offres_soumissions" ON public.appels_offres_soumissions;
CREATE POLICY "Users manage appels_offres_soumissions" ON public.appels_offres_soumissions
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage appels_offres_comparatifs" ON public.appels_offres_comparatifs;
CREATE POLICY "Users manage appels_offres_comparatifs" ON public.appels_offres_comparatifs
  FOR ALL USING (auth.uid() = user_id);

-- Bottin tables
ALTER TABLE public.bottin_equipe_membres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bottin_equipe_equipements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage bottin_equipe_membres" ON public.bottin_equipe_membres;
CREATE POLICY "Users manage bottin_equipe_membres" ON public.bottin_equipe_membres
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.bottin_equipes WHERE id = equipe_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users manage bottin_equipe_equipements" ON public.bottin_equipe_equipements;
CREATE POLICY "Users manage bottin_equipe_equipements" ON public.bottin_equipe_equipements
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.bottin_equipes WHERE id = equipe_id AND user_id = auth.uid())
  );

-- Matériaux tables
ALTER TABLE public.materiaux_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materiaux_prix_historique ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read materiaux_categories" ON public.materiaux_categories;
CREATE POLICY "Public read materiaux_categories" ON public.materiaux_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users manage materiaux_prix_historique" ON public.materiaux_prix_historique;
CREATE POLICY "Users manage materiaux_prix_historique" ON public.materiaux_prix_historique
  FOR ALL USING (auth.uid() = user_id);

-- Soumissions tables
ALTER TABLE public.soumissions_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.soumissions_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage soumissions_sections" ON public.soumissions_sections;
CREATE POLICY "Users manage soumissions_sections" ON public.soumissions_sections
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.soumissions_v2 WHERE id = soumission_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users manage soumissions_items" ON public.soumissions_items;
CREATE POLICY "Users manage soumissions_items" ON public.soumissions_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.soumissions_sections s 
            JOIN public.soumissions_v2 sv ON s.soumission_id = sv.id 
            WHERE s.id = section_id AND sv.user_id = auth.uid())
  );

-- ============================================================================
-- 7. STORAGE BUCKET POUR TAKEOFF
-- ============================================================================

-- Note: Exécuter ces commandes séparément si nécessaire
INSERT INTO storage.buckets (id, name, public)
VALUES ('takeoff-plans', 'takeoff-plans', true)
ON CONFLICT (id) DO NOTHING;

-- Policy storage
DROP POLICY IF EXISTS "Users can upload takeoff plans" ON storage.objects;
CREATE POLICY "Users can upload takeoff plans" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'takeoff-plans' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can view takeoff plans" ON storage.objects;
CREATE POLICY "Users can view takeoff plans" ON storage.objects
  FOR SELECT USING (bucket_id = 'takeoff-plans');

DROP POLICY IF EXISTS "Users can delete their takeoff plans" ON storage.objects;
CREATE POLICY "Users can delete their takeoff plans" ON storage.objects
  FOR DELETE USING (bucket_id = 'takeoff-plans' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================================
-- 8. VUE HELPER POUR LES VUES SECURITY DEFINER
-- ============================================================================

-- Recréer les vues sans SECURITY DEFINER
DROP VIEW IF EXISTS public.bid_proposal_summary;
DROP VIEW IF EXISTS public.bid_direct_costs_summary;
DROP VIEW IF EXISTS public.v_ccq_current_rates;
DROP VIEW IF EXISTS public.v_soumissions_stats;

-- Recréer v_ccq_current_rates comme vue normale
CREATE OR REPLACE VIEW public.v_ccq_current_rates AS
SELECT 
  t.id as trade_id,
  t.code as trade_code,
  t.name_fr as trade_name,
  s.name_fr as sector_name,
  hr.base_rate,
  hr.vacation_rate,
  hr.overtime_rate_150,
  hr.overtime_rate_200,
  hr.effective_date
FROM public.ccq_trades t
JOIN public.ccq_sectors s ON t.sector_id = s.id
LEFT JOIN public.ccq_hourly_rates hr ON t.id = hr.trade_id
WHERE hr.effective_date = (
  SELECT MAX(effective_date) 
  FROM public.ccq_hourly_rates 
  WHERE trade_id = t.id
);

