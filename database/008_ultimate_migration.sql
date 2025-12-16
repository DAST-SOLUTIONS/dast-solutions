-- ============================================================================
-- DAST Solutions - ULTIMATE Migration
-- Modules 1-6: PDF, Photos, Emails, Takeoff→Soumission, Analytics, Signatures
-- Exécuter dans Supabase SQL Editor
-- ============================================================================

-- ============================================
-- MODULE 2: STORAGE POUR PHOTOS
-- ============================================

-- Créer le bucket pour les photos (si pas déjà fait)
INSERT INTO storage.buckets (id, name, public)
VALUES ('rapport-photos', 'rapport-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Politique pour upload photos
CREATE POLICY "Users can upload rapport photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'rapport-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view rapport photos" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'rapport-photos');

CREATE POLICY "Users can delete own rapport photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'rapport-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================
-- MODULE 3: HISTORIQUE EMAILS
-- ============================================

CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Destinataire
  to_email VARCHAR(255) NOT NULL,
  to_name VARCHAR(255),
  
  -- Contenu
  subject VARCHAR(500) NOT NULL,
  template VARCHAR(100),
  
  -- Référence
  reference_type VARCHAR(50),
  reference_id UUID,
  
  -- Statut
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
  error_message TEXT,
  
  -- Timestamps
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_logs_user ON email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);

ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "email_logs_policy" ON email_logs
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- MODULE 6: SIGNATURES ÉLECTRONIQUES
-- ============================================

CREATE TABLE IF NOT EXISTS signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Type de document signé
  document_type VARCHAR(50) NOT NULL CHECK (document_type IN (
    'rapport_terrain', 'facture', 'soumission', 'contrat', 'autre'
  )),
  document_id UUID NOT NULL,
  
  -- Signataire
  signer_name VARCHAR(255) NOT NULL,
  signer_email VARCHAR(255),
  signer_role VARCHAR(100), -- 'client', 'entrepreneur', 'superviseur', etc.
  
  -- Signature (base64 du canvas)
  signature_data TEXT NOT NULL,
  
  -- Métadonnées
  ip_address VARCHAR(50),
  user_agent TEXT,
  
  -- Timestamps
  signed_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_signatures_document ON signatures(document_type, document_id);
CREATE INDEX IF NOT EXISTS idx_signatures_user ON signatures(user_id);

ALTER TABLE signatures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "signatures_policy" ON signatures
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- MODULE 5: VUES ANALYTICS
-- ============================================

-- Vue des statistiques projets
CREATE OR REPLACE VIEW project_analytics AS
SELECT 
  p.id,
  p.name,
  p.status,
  p.budget,
  p.created_at,
  p.user_id,
  COALESCE(s.soumissions_count, 0) as soumissions_count,
  COALESCE(s.soumissions_total, 0) as soumissions_total,
  COALESCE(s.soumissions_acceptees, 0) as soumissions_acceptees,
  COALESCE(f.factures_count, 0) as factures_count,
  COALESCE(f.factures_total, 0) as factures_total,
  COALESCE(f.factures_payees, 0) as factures_payees,
  COALESCE(f.montant_encaisse, 0) as montant_encaisse,
  COALESCE(r.rapports_count, 0) as rapports_count
FROM projects p
LEFT JOIN (
  SELECT 
    project_id,
    COUNT(*) as soumissions_count,
    SUM(total) as soumissions_total,
    COUNT(*) FILTER (WHERE status = 'acceptee') as soumissions_acceptees
  FROM soumissions
  GROUP BY project_id
) s ON p.id = s.project_id
LEFT JOIN (
  SELECT 
    project_id,
    COUNT(*) as factures_count,
    SUM(total) as factures_total,
    COUNT(*) FILTER (WHERE status = 'payee') as factures_payees,
    SUM(amount_paid) as montant_encaisse
  FROM factures
  GROUP BY project_id
) f ON p.id = f.project_id
LEFT JOIN (
  SELECT 
    project_id,
    COUNT(*) as rapports_count
  FROM rapports_terrain
  GROUP BY project_id
) r ON p.id = r.project_id;

-- Vue des revenus mensuels
CREATE OR REPLACE VIEW monthly_revenue AS
SELECT 
  DATE_TRUNC('month', date_facture) as mois,
  user_id,
  COUNT(*) as factures_count,
  SUM(total) as total_facture,
  SUM(amount_paid) as total_encaisse,
  SUM(balance_due) as total_du
FROM factures
WHERE status != 'annulee'
GROUP BY DATE_TRUNC('month', date_facture), user_id
ORDER BY mois DESC;

-- ============================================
-- MISE À JOUR TABLES EXISTANTES
-- ============================================

-- Ajouter colonne signature aux rapports terrain (si pas déjà fait)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rapports_terrain' AND column_name = 'signature_id') THEN
    ALTER TABLE rapports_terrain ADD COLUMN signature_id UUID REFERENCES signatures(id);
  END IF;
END $$;

-- Ajouter colonne signature aux factures (si pas déjà fait)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'factures' AND column_name = 'signature_id') THEN
    ALTER TABLE factures ADD COLUMN signature_id UUID REFERENCES signatures(id);
  END IF;
END $$;

-- ============================================
-- FONCTION: Générer rappels automatiques
-- ============================================

CREATE OR REPLACE FUNCTION generate_automatic_reminders()
RETURNS INTEGER AS $$
DECLARE
  reminder_count INTEGER := 0;
  user_rec RECORD;
  soum_rec RECORD;
  fact_rec RECORD;
BEGIN
  -- Parcourir tous les utilisateurs
  FOR user_rec IN SELECT id FROM auth.users LOOP
    
    -- Soumissions qui expirent dans 7 jours
    FOR soum_rec IN 
      SELECT id, soumission_number, client_name, date_valid_until
      FROM soumissions
      WHERE user_id = user_rec.id
        AND status = 'envoyee'
        AND date_valid_until BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
        AND id NOT IN (
          SELECT reference_id FROM notifications 
          WHERE type = 'soumission_expire' 
            AND reference_id IS NOT NULL 
            AND dismissed_at IS NULL
        )
    LOOP
      INSERT INTO notifications (user_id, type, title, message, reference_type, reference_id, priority)
      VALUES (
        user_rec.id,
        'soumission_expire',
        'Soumission ' || soum_rec.soumission_number || ' expire bientôt',
        'La soumission pour ' || soum_rec.client_name || ' expire le ' || TO_CHAR(soum_rec.date_valid_until, 'DD/MM/YYYY'),
        'soumission',
        soum_rec.id,
        'high'
      );
      reminder_count := reminder_count + 1;
    END LOOP;
    
    -- Factures en retard
    FOR fact_rec IN 
      SELECT id, facture_number, client_name, date_echeance, balance_due
      FROM factures
      WHERE user_id = user_rec.id
        AND status IN ('envoyee', 'partielle')
        AND date_echeance < CURRENT_DATE
        AND id NOT IN (
          SELECT reference_id FROM notifications 
          WHERE type = 'facture_retard' 
            AND reference_id IS NOT NULL 
            AND dismissed_at IS NULL
            AND created_at > CURRENT_DATE - INTERVAL '7 days'
        )
    LOOP
      INSERT INTO notifications (user_id, type, title, message, reference_type, reference_id, priority)
      VALUES (
        user_rec.id,
        'facture_retard',
        'Facture ' || fact_rec.facture_number || ' en retard',
        'Montant dû: ' || TO_CHAR(fact_rec.balance_due, 'FM999,999.00$'),
        'facture',
        fact_rec.id,
        'urgent'
      );
      reminder_count := reminder_count + 1;
    END LOOP;
    
  END LOOP;
  
  RETURN reminder_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VÉRIFICATION
-- ============================================

SELECT 'Tables créées:' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('email_logs', 'signatures')
ORDER BY table_name;

SELECT 'Vues créées:' as info;
SELECT table_name FROM information_schema.views 
WHERE table_schema = 'public' 
  AND table_name IN ('project_analytics', 'monthly_revenue')
ORDER BY table_name;
