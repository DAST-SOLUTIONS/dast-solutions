-- ============================================================================
-- DAST Solutions - Migration 010: Takeoff ↔ Catalogue Integration
-- Lien entre les mesures de takeoff et la base de données de coûts (BIM)
-- Exécuter dans Supabase SQL Editor APRÈS les migrations 002, 003, 011
-- ============================================================================

-- ============================================================================
-- 1. LIEN DIRECT : takeoff_items → cost_items
-- ============================================================================

-- Ajouter la colonne cost_item_id dans takeoff_items (si elle n'existe pas)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'takeoff_items' AND column_name = 'cost_item_id'
    ) THEN
        ALTER TABLE takeoff_items 
        ADD COLUMN cost_item_id UUID REFERENCES cost_items(id) ON DELETE SET NULL;
        RAISE NOTICE '✅ Colonne cost_item_id ajoutée à takeoff_items';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'takeoff_items' AND column_name = 'unit_price_override'
    ) THEN
        ALTER TABLE takeoff_items 
        ADD COLUMN unit_price_override DECIMAL(15,4);
        RAISE NOTICE '✅ Colonne unit_price_override ajoutée';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'takeoff_items' AND column_name = 'pricing_note'
    ) THEN
        ALTER TABLE takeoff_items 
        ADD COLUMN pricing_note TEXT;
        RAISE NOTICE '✅ Colonne pricing_note ajoutée';
    END IF;
END $$;

-- ============================================================================
-- 2. TABLE ASSEMBLAGES / FAMILLES (comme objets BIM)
-- ============================================================================

CREATE TABLE IF NOT EXISTS cost_assemblies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE,                        -- ex: "ASS-MUR-01"
    name TEXT NOT NULL,                      -- ex: "Mur extérieur 2x6 R-24"
    description TEXT,
    category_code TEXT REFERENCES cost_categories(code),
    unit TEXT NOT NULL DEFAULT 'm²',         -- unité de l'assemblage complet
    
    -- Image et fiche technique (Storage Supabase)
    image_url TEXT,
    spec_sheet_url TEXT,
    
    -- Prix calculé automatiquement depuis les composantes
    total_material_cost DECIMAL(15,4),
    total_labor_cost DECIMAL(15,4),
    total_cost DECIMAL(15,4),
    
    -- Métadonnées
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Composantes d'un assemblage
CREATE TABLE IF NOT EXISTS cost_assembly_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assembly_id UUID NOT NULL REFERENCES cost_assemblies(id) ON DELETE CASCADE,
    cost_item_id UUID NOT NULL REFERENCES cost_items(id) ON DELETE RESTRICT,
    
    quantity DECIMAL(15,4) NOT NULL DEFAULT 1,   -- quantité par unité d'assemblage
    unit TEXT NOT NULL,
    waste_factor DECIMAL(5,4) DEFAULT 0.05,      -- 5% gaspillage par défaut
    
    sort_order INT DEFAULT 0,
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_cost_assembly_items_assembly ON cost_assembly_items(assembly_id);
CREATE INDEX IF NOT EXISTS idx_cost_assembly_items_item ON cost_assembly_items(cost_item_id);

-- ============================================================================
-- 3. TABLE LIENS TAKEOFF ↔ ASSEMBLAGES (many-to-many)
-- ============================================================================

CREATE TABLE IF NOT EXISTS takeoff_assembly_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    takeoff_item_id UUID NOT NULL REFERENCES takeoff_items(id) ON DELETE CASCADE,
    assembly_id UUID NOT NULL REFERENCES cost_assemblies(id) ON DELETE CASCADE,
    
    -- Quantité du takeoff appliquée à l'assemblage
    applied_quantity DECIMAL(15,4) NOT NULL,
    unit TEXT NOT NULL,
    
    -- Prix appliqué au moment de la liaison (snapshot)
    unit_price_snapshot DECIMAL(15,4),
    total_price_snapshot DECIMAL(15,4),
    
    linked_at TIMESTAMPTZ DEFAULT NOW(),
    linked_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_takeoff_assembly_links_takeoff ON takeoff_assembly_links(takeoff_item_id);
CREATE INDEX IF NOT EXISTS idx_takeoff_assembly_links_assembly ON takeoff_assembly_links(assembly_id);

-- ============================================================================
-- 4. VUE : Takeoff avec prix du catalogue
-- ============================================================================

CREATE OR REPLACE VIEW v_takeoff_with_pricing AS
SELECT 
    ti.id AS takeoff_item_id,
    ti.project_id,
    ti.label,
    ti.category,
    ti.quantity,
    ti.unit,
    
    -- Prix depuis cost_items (catalogue)
    ci.id AS catalogue_item_id,
    ci.code AS catalogue_code,
    ci.name AS catalogue_name,
    ci.price_material,
    ci.price_labor,
    ci.price_total AS catalogue_unit_price,
    
    -- Prix effectif (override ou catalogue)
    COALESCE(ti.unit_price_override, ci.price_total) AS effective_unit_price,
    
    -- Totaux calculés
    ti.quantity * COALESCE(ti.unit_price_override, ci.price_material, 0) AS total_material,
    ti.quantity * COALESCE(ci.price_labor, 0) AS total_labor,
    ti.quantity * COALESCE(ti.unit_price_override, ci.price_total, 0) AS total_price,
    
    ti.pricing_note,
    ti.created_at

FROM takeoff_items ti
LEFT JOIN cost_items ci ON ti.cost_item_id = ci.id;

-- ============================================================================
-- 5. FONCTION : Calculer le coût d'un takeoff complet
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_takeoff_total(p_project_id UUID)
RETURNS TABLE (
    total_materials DECIMAL(15,4),
    total_labor DECIMAL(15,4),
    total_cost DECIMAL(15,4),
    item_count BIGINT,
    priced_item_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        SUM(quantity * COALESCE(unit_price_override, ci.price_material, 0))::DECIMAL(15,4),
        SUM(quantity * COALESCE(ci.price_labor, 0))::DECIMAL(15,4),
        SUM(quantity * COALESCE(unit_price_override, ci.price_total, 0))::DECIMAL(15,4),
        COUNT(*)::BIGINT,
        COUNT(cost_item_id)::BIGINT
    FROM takeoff_items ti
    LEFT JOIN cost_items ci ON ti.cost_item_id = ci.id
    WHERE ti.project_id = p_project_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. RLS - Row Level Security
-- ============================================================================

ALTER TABLE cost_assemblies ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_assembly_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE takeoff_assembly_links ENABLE ROW LEVEL SECURITY;

-- cost_assemblies : lecture publique, écriture par propriétaire
DROP POLICY IF EXISTS "Assemblages visibles par tous" ON cost_assemblies;
CREATE POLICY "Assemblages visibles par tous" ON cost_assemblies
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Assemblages modifiables par créateur" ON cost_assemblies;
CREATE POLICY "Assemblages modifiables par créateur" ON cost_assemblies
    FOR ALL USING (auth.uid() = created_by);

-- cost_assembly_items : lecture publique
DROP POLICY IF EXISTS "Items d'assemblage visibles par tous" ON cost_assembly_items;
CREATE POLICY "Items d'assemblage visibles par tous" ON cost_assembly_items
    FOR SELECT USING (true);

-- takeoff_assembly_links : par projet (via takeoff_items)
DROP POLICY IF EXISTS "Liens takeoff par utilisateur" ON takeoff_assembly_links;
CREATE POLICY "Liens takeoff par utilisateur" ON takeoff_assembly_links
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM takeoff_items ti
            JOIN projects p ON ti.project_id = p.id
            WHERE ti.id = takeoff_assembly_links.takeoff_item_id
            AND p.user_id = auth.uid()
        )
    );

-- ============================================================================
-- 7. TRIGGER : Recalcul automatique du prix total d'un assemblage
-- ============================================================================

CREATE OR REPLACE FUNCTION recalculate_assembly_cost()
RETURNS TRIGGER AS $$
DECLARE
    v_assembly_id UUID;
    v_total_material DECIMAL(15,4);
    v_total_labor DECIMAL(15,4);
BEGIN
    v_assembly_id := COALESCE(NEW.assembly_id, OLD.assembly_id);
    
    SELECT 
        SUM(cai.quantity * (1 + cai.waste_factor) * COALESCE(ci.price_material, 0)),
        SUM(cai.quantity * COALESCE(ci.price_labor, 0))
    INTO v_total_material, v_total_labor
    FROM cost_assembly_items cai
    JOIN cost_items ci ON cai.cost_item_id = ci.id
    WHERE cai.assembly_id = v_assembly_id;
    
    UPDATE cost_assemblies SET
        total_material_cost = COALESCE(v_total_material, 0),
        total_labor_cost = COALESCE(v_total_labor, 0),
        total_cost = COALESCE(v_total_material, 0) + COALESCE(v_total_labor, 0),
        updated_at = NOW()
    WHERE id = v_assembly_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_recalculate_assembly ON cost_assembly_items;
CREATE TRIGGER trg_recalculate_assembly
    AFTER INSERT OR UPDATE OR DELETE ON cost_assembly_items
    FOR EACH ROW EXECUTE FUNCTION recalculate_assembly_cost();

-- ============================================================================
-- 8. ASSEMBLAGES DE BASE (exemples québécois)
-- ============================================================================

DO $$
DECLARE v_user_id UUID;
BEGIN
    -- Assemblage exemple : Mur extérieur 2x6
    IF NOT EXISTS (SELECT 1 FROM cost_assemblies WHERE code = 'ASS-MUR-EXT-2X6') THEN
        INSERT INTO cost_assemblies (code, name, description, unit, category_code)
        VALUES (
            'ASS-MUR-EXT-2X6',
            'Mur extérieur 2x6 R-24 avec pare-air',
            'Ossature bois 2x6 à 16" c/c, isolant soufflé R-24, pare-air Tyvek, gypse 5/8" intérieur',
            'm²',
            '06'
        );
        RAISE NOTICE '✅ Assemblage ASS-MUR-EXT-2X6 créé';
    END IF;

    -- Assemblage exemple : Dalle béton 4"
    IF NOT EXISTS (SELECT 1 FROM cost_assemblies WHERE code = 'ASS-DALLE-BET-4PO') THEN
        INSERT INTO cost_assemblies (code, name, description, unit, category_code)
        VALUES (
            'ASS-DALLE-BET-4PO',
            'Dalle béton 4" sur sol avec vapeur-barrière',
            'Remblai compacté, vapeur-barrière 6 mil, treillis 6x6 W1.4, béton 25 MPa 4"',
            'm²',
            '03'
        );
        RAISE NOTICE '✅ Assemblage ASS-DALLE-BET-4PO créé';
    END IF;
END $$;

-- ============================================================================
-- CONFIRMATION
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Migration 010 - Takeoff ↔ Catalogue Integration terminée!';
    RAISE NOTICE '   Tables créées: cost_assemblies, cost_assembly_items, takeoff_assembly_links';
    RAISE NOTICE '   Vue créée: v_takeoff_with_pricing';
    RAISE NOTICE '   Fonction créée: calculate_takeoff_total()';
    RAISE NOTICE '   Colonnes ajoutées: takeoff_items.cost_item_id, unit_price_override, pricing_note';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  PRÉREQUIS: Migrations 002, 003, 011 doivent être exécutées avant.';
END $$;
