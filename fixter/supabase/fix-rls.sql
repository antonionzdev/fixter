-- =============================================================================
-- Fixter: políticas RLS para publicar anuncios
-- Ejecuta TODO este script en Supabase → SQL Editor → Run
-- =============================================================================

-- -----------------------------------------------------------------------------
-- LISTINGS
-- -----------------------------------------------------------------------------
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read listings" ON public.listings;
DROP POLICY IF EXISTS "Authenticated insert own listings" ON public.listings;
DROP POLICY IF EXISTS "Owners update own listings" ON public.listings;
DROP POLICY IF EXISTS "Owners delete own listings" ON public.listings;

-- Cualquiera puede ver anuncios (home / marketplace)
CREATE POLICY "Public read listings"
ON public.listings
FOR SELECT
TO anon, authenticated
USING (true);

-- Solo usuarios autenticados; seller_id debe ser su propio auth.uid()
CREATE POLICY "Authenticated insert own listings"
ON public.listings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = seller_id);

-- UPDATE: gestionada en create-reviews-schema.sql (incluye restricciones sobre
-- confirmed_buyer_id). Ejecuta ese script después de éste para que la policy
-- quede correcta. El DROP IF EXISTS de la línea 13 limpia versiones antiguas.

CREATE POLICY "Owners delete own listings"
ON public.listings
FOR DELETE
TO authenticated
USING (auth.uid() = seller_id);

-- Permisos de rol (necesarios además de RLS)
GRANT SELECT ON public.listings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.listings TO authenticated;

-- -----------------------------------------------------------------------------
-- PROFILES (por si el registro también falla por RLS)
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;

CREATE POLICY "Public read profiles"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Users insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- -----------------------------------------------------------------------------
-- STORAGE: bucket listing-images
-- La app sube a: {userId}/{batchId}/{filename}
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public read listing images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload listing images" ON storage.objects;
DROP POLICY IF EXISTS "Owners update listing images" ON storage.objects;
DROP POLICY IF EXISTS "Owners delete listing images" ON storage.objects;

-- Lectura pública de imágenes del bucket
CREATE POLICY "Public read listing images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'listing-images');

-- Subida solo en carpeta con el UUID del usuario
CREATE POLICY "Authenticated upload listing images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'listing-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Owners update listing images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'listing-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'listing-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Owners delete listing images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'listing-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
