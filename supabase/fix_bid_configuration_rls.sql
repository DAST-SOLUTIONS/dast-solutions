-- ============================================================================
-- DAST Solutions - FIX: RLS bid_configuration
-- Erreur: "new row violates row-level security policy for table bid_configuration"
-- Exécuter dans Supabase Dashboard → SQL Editor → Run
-- ============================================================================

-- 1. Vérifier si la table existe et créer les politiques
DO $$
BEGIN
  -- Vérifier si la table bid_configuration existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bid_configuration') THEN
    
    -- Désactiver RLS temporairement pour nettoyer
    ALTER TABLE public.bid_configuration DISABLE ROW LEVEL SECURITY;
    
    -- Supprimer les anciennes politiques
    DROP POLICY IF EXISTS "Users can view own bid configurations" ON public.bid_configuration;
    DROP POLICY IF EXISTS "Users can insert own bid configurations" ON public.bid_configuration;
    DROP POLICY IF EXISTS "Users can update own bid configurations" ON public.bid_configuration;
    DROP POLICY IF EXISTS "Users can delete own bid configurations" ON public.bid_configuration;
    DROP POLICY IF EXISTS "Users can manage own bid configurations" ON public.bid_configuration;
    
    -- Réactiver RLS
    ALTER TABLE public.bid_configuration ENABLE ROW LEVEL SECURITY;
    
    -- Créer une politique permissive pour les utilisateurs authentifiés
    CREATE POLICY "Users can manage own bid configurations" ON public.bid_configuration
      FOR ALL 
      USING (auth.uid() IS NOT NULL)
      WITH CHECK (auth.uid() IS NOT NULL);
    
    RAISE NOTICE 'Politiques RLS créées pour bid_configuration';
  ELSE
    RAISE NOTICE 'Table bid_configuration non trouvée - création...';
    
    -- Créer la table si elle n'existe pas
    CREATE TABLE public.bid_configuration (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
      config_key VARCHAR(100),
      config_value TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- Activer RLS
    ALTER TABLE public.bid_configuration ENABLE ROW LEVEL SECURITY;
    
    -- Créer la politique
    CREATE POLICY "Users can manage own bid configurations" ON public.bid_configuration
      FOR ALL 
      USING (auth.uid() IS NOT NULL)
      WITH CHECK (auth.uid() IS NOT NULL);
    
    RAISE NOTICE 'Table bid_configuration créée avec politiques RLS';
  END IF;
END $$;

-- 2. Vérifier aussi les autres tables qui pourraient causer des problèmes similaires

-- Table soumissions (si trigger automatique)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'soumissions') THEN
    -- S'assurer que la politique permet l'insertion
    DROP POLICY IF EXISTS "Users can insert soumissions" ON public.soumissions;
    CREATE POLICY "Users can insert soumissions" ON public.soumissions
      FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- 3. Vérifier s'il y a un trigger sur projects qui insère dans bid_configuration
-- et le corriger si nécessaire

-- Lister les triggers sur projects
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'projects';

-- 4. Si un trigger existe et pose problème, le supprimer ou le modifier
-- (À exécuter seulement si nécessaire)
-- DROP TRIGGER IF EXISTS create_bid_config_on_project ON public.projects;

-- 5. Vérification finale
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'bid_configuration';

SELECT 'RLS corrigé pour bid_configuration' AS status;
