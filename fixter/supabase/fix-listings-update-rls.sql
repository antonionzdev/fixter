-- =============================================================================
-- Fix: UPDATE / DELETE en listings (marcar como vendido, eliminar)
-- Ejecuta en Supabase → SQL Editor si falla "row-level security policy"
-- =============================================================================

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas antiguas o duplicadas
DROP POLICY IF EXISTS "Public read listings" ON public.listings;
DROP POLICY IF EXISTS "Authenticated insert own listings" ON public.listings;
DROP POLICY IF EXISTS "Owners update own listings" ON public.listings;
DROP POLICY IF EXISTS "Owners delete own listings" ON public.listings;
DROP POLICY IF EXISTS "Users can update own listings" ON public.listings;
DROP POLICY IF EXISTS "Users can delete own listings" ON public.listings;
DROP POLICY IF EXISTS "Enable update for users based on seller_id" ON public.listings;
DROP POLICY IF EXISTS "Enable delete for users based on seller_id" ON public.listings;

-- Lectura pública
CREATE POLICY "Public read listings"
ON public.listings
FOR SELECT
TO anon, authenticated
USING (true);

-- Insert solo como vendedor
CREATE POLICY "Authenticated insert own listings"
ON public.listings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = seller_id);

-- UPDATE: gestionada en create-reviews-schema.sql (incluye restricciones sobre
-- confirmed_buyer_id). Ejecuta ese script después de éste para que la policy
-- quede correcta. El DROP IF EXISTS de la línea 11 limpia versiones antiguas.

-- Delete
CREATE POLICY "Owners delete own listings"
ON public.listings
FOR DELETE
TO authenticated
USING (auth.uid() = seller_id);

GRANT SELECT ON public.listings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.listings TO authenticated;
