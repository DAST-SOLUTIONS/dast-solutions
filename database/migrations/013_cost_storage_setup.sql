-- ============================================================================
-- DAST Solutions - Supabase Storage Setup pour Base de Coûts
-- À exécuter dans Supabase Dashboard > Storage
-- ============================================================================

-- NOTE: Les buckets doivent être créés via le Dashboard Supabase UI ou via API
-- Voici les commandes SQL pour les policies:

-- Bucket: dast-assets (pour images produits + fiches techniques)
-- Créer dans Dashboard > Storage > New bucket > "dast-assets" > Public: YES

-- Policies pour dast-assets:
INSERT INTO storage.buckets (id, name, public) 
VALUES ('dast-assets', 'dast-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow all authenticated users to upload
CREATE POLICY "authenticated users can upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'dast-assets');

-- Allow public read
CREATE POLICY "public read dast-assets" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'dast-assets');

-- Allow authenticated to delete own files
CREATE POLICY "authenticated delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'dast-assets');

-- ============================================================================
-- FUNCTION: Import prix depuis CSV
-- Appelé par le module PriceUpdater
-- ============================================================================
CREATE OR REPLACE FUNCTION bulk_update_prices(
  updates jsonb[]
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  update_record jsonb;
  updated_count int := 0;
  not_found_count int := 0;
  item_id uuid;
BEGIN
  FOREACH update_record IN ARRAY updates
  LOOP
    -- Find item by code
    SELECT id INTO item_id 
    FROM cost_items 
    WHERE code = update_record->>'code';
    
    IF item_id IS NOT NULL THEN
      -- Save history
      INSERT INTO cost_price_history (
        item_id,
        price_material_old,
        price_material_new,
        change_reason
      )
      SELECT 
        id,
        price_material,
        (update_record->>'price_material')::decimal,
        COALESCE(update_record->>'source', 'Import bulk')
      FROM cost_items WHERE id = item_id;
      
      -- Update prices
      UPDATE cost_items SET
        price_material = COALESCE((update_record->>'price_material')::decimal, price_material),
        price_labor = COALESCE((update_record->>'price_labor')::decimal, price_labor),
        price_equipment = COALESCE((update_record->>'price_equipment')::decimal, price_equipment),
        last_price_update = NOW()
      WHERE id = item_id;
      
      updated_count := updated_count + 1;
    ELSE
      not_found_count := not_found_count + 1;
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'updated', updated_count,
    'not_found', not_found_count
  );
END;
$$;
