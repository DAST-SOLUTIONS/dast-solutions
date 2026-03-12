-- ============================================================================
-- DAST Solutions - Migration 010: Takeoff ↔ Catalogue Integration (CORRIGÉ)
-- Exécuter dans Supabase SQL Editor
-- Prérequis: tables takeoff_items, cost_items, cost_assemblies existent ✅
-- ============================================================================

-- ============================================================================
-- 1. AJOUTER LES COLONNES MANQUANTES dans takeoff_items
--    ALTER TABLE hors du bloc DO $$ pour éviter l'erreur 42703
-- ============================================================================

ALTER TABLE public.takeoff_items 
    ADD COLUMN IF NOT EXISTS cost_item_id UUID REFERENCES cost_items(id) ON DELETE SET NULL;

ALTER TABLE public.takeoff_items 
    ADD COLUMN IF NOT EXISTS unit_price_override DECIMAL(15,4);

ALTER TABLE public.takeoff_items 
    ADD COLUMN IF NOT EXISTS pricing_note TEXT;

ALTER TABLE public.takeoff_items 
    ADD COLUMN IF NOT EXISTS label VARCHAR(255);

-- ============================================================================
-- 2. TABLE LIENS TAKEOFF ↔ ASSEMBLAGES
-- ============================================================================

CREATE TABLE IF NOT EXISTS takeoff_assembly_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    takeoff_item_id UUID NOT NULL REFERENCES public.takeoff_items(id) ON DELETE CASCADE,
    assembly_id UUID NOT NULL REFERENCES cost_assemblies(id) ON DELETE CASCADE,
    applied_quantity DECIMAL(15,4) NOT NULL DEFAULT 1,
    unit TEXT NOT NULL DEFAULT 'm²',
    unit_price_snapshot DECIMAL(15,4),
    total_price_snapshot DECIMAL(15,4),
    linked_at TIMESTAMPTZ DEFAULT NOW(),
    linked_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_takeoff_assembly_links_takeoff 
    ON takeoff_assembly_links(takeoff_item_id);
CREATE INDEX IF NOT EXISTS idx_takeoff_assembly_links_assembly 
    ON takeoff_assembly_links(assembly_id);

CREATE INDEX IF NOT EXISTS idx_takeoff_items_cost_item 
    ON public.takeoff_items(cost_item_id);

-- ============================================================================
-- 3. VUE : Takeoff avec prix du catalogue
-- ============================================================================

DROP VIEW IF EXISTS v_takeoff_with_pricing;

CREATE VIEW v_takeoff_with_pricing AS
SELECT 
    ti.id AS takeoff_item_id,
    ti.project_id,
    COALESCE(ti.label, ti.item_name) AS label,
    ti.category,
    ti.quantity,
    ti.unit,
    ci.id AS catalogue_item_id,
    ci.code AS catalogue_code,
    ci.name AS catalogue_name,
    ci.price_material,
    ci.price_labor,
    ci.price_total AS catalogue_unit_price,
    COALESCE(ti.unit_price_override, ci.price_total, ti.unit_price) AS effective_unit_price,
    ti.quantity * COALESCE(ti.unit_price_override, ci.price_material, 0) AS total_material,
    ti.quantity * COALESCE(ci.price_labor, 0) AS total_labor,
    ti.quantity * COALESCE(ti.unit_price_override, ci.price_total, ti.unit_price, 0) AS total_price,
    ti.pricing_note,
    ti.created_at
FROM public.takeoff_items ti
LEFT JOIN cost_items ci ON ti.cost_item_id = ci.id;

-- ============================================================================
-- 4. FONCTION : Total d'un projet
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_takeoff_total(p_project_id UUID)
RETURNS TABLE (
    total_materials   DECIMAL(15,4),
    total_labor       DECIMAL(15,4),
    total_cost        DECIMAL(15,4),
    item_count        BIGINT,
    priced_item_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        SUM(ti.quantity * COALESCE(ti.unit_price_override, ci.price_material, 0))::DECIMAL(15,4),
        SUM(ti.quantity * COALESCE(ci.price_labor, 0))::DECIMAL(15,4),
        SUM(ti.quantity * COALESCE(ti.unit_price_override, ci.price_total, ti.unit_price, 0))::DECIMAL(15,4),
        COUNT(*)::BIGINT,
        COUNT(ti.cost_item_id)::BIGINT
    FROM public.takeoff_items ti
    LEFT JOIN cost_items ci ON ti.cost_item_id = ci.id
    WHERE ti.project_id = p_project_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. RLS
-- ============================================================================

ALTER TABLE takeoff_assembly_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Liens takeoff par utilisateur" ON takeoff_assembly_links;
CREATE POLICY "Liens takeoff par utilisateur" ON takeoff_assembly_links
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.takeoff_items ti
            JOIN public.projects p ON ti.project_id = p.id
            WHERE ti.id = takeoff_assembly_links.takeoff_item_id
              AND p.user_id = auth.uid()
        )
    );

-- ============================================================================
-- CONFIRMATION
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Migration 010 terminée avec succès!';
    RAISE NOTICE '   Colonnes ajoutées à takeoff_items: cost_item_id, unit_price_override, pricing_note, label';
    RAISE NOTICE '   Table créée: takeoff_assembly_links';
    RAISE NOTICE '   Vue créée: v_takeoff_with_pricing';
    RAISE NOTICE '   Fonction créée: calculate_takeoff_total()';
END $$;
