-- =============================================================================
-- Fixter: reviews + nuevos campos de perfil + políticas Storage para avatars
-- Ejecuta TODO este script en Supabase → SQL Editor → Run
--
-- ANTES de ejecutar:
--   Crea el bucket "avatars" manualmente en Supabase Dashboard → Storage →
--   New bucket → nombre: avatars → Public bucket: ON
--   (Las políticas de storage.objects se crean aquí pero el bucket no.)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Nuevos campos en profiles
--    full_name ya figura en el schema inferido; ADD COLUMN IF NOT EXISTS es idem.
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS bio       TEXT,
  ADD COLUMN IF NOT EXISTS phone     TEXT;

-- -----------------------------------------------------------------------------
-- 2. Tabla reviews
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reviews (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id   UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewed_id   UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id    UUID        NOT NULL REFERENCES public.listings(id)  ON DELETE CASCADE,
  rating        SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Un usuario solo puede valorar una vez por anuncio
  CONSTRAINT reviews_one_per_listing UNIQUE (reviewer_id, listing_id),
  -- Un usuario no puede valorarse a sí mismo
  CONSTRAINT reviews_no_self_review  CHECK  (reviewer_id <> reviewed_id)
);

CREATE INDEX IF NOT EXISTS reviews_reviewed_id_idx ON public.reviews(reviewed_id);
CREATE INDEX IF NOT EXISTS reviews_listing_id_idx  ON public.reviews(listing_id);

-- -----------------------------------------------------------------------------
-- 3. RLS para reviews
-- -----------------------------------------------------------------------------
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read reviews"         ON public.reviews;
DROP POLICY IF EXISTS "Authenticated insert review" ON public.reviews;
DROP POLICY IF EXISTS "Owners update review"        ON public.reviews;
DROP POLICY IF EXISTS "Owners delete review"        ON public.reviews;

CREATE POLICY "Public read reviews"
ON public.reviews FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Authenticated insert review"
ON public.reviews FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Owners update review"
ON public.reviews FOR UPDATE
TO authenticated
USING  (auth.uid() = reviewer_id)
WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Owners delete review"
ON public.reviews FOR DELETE
TO authenticated
USING (auth.uid() = reviewer_id);

GRANT SELECT                    ON public.reviews TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE    ON public.reviews TO authenticated;

-- -----------------------------------------------------------------------------
-- 4. Políticas Storage para bucket "avatars"
--    Path esperado: {auth.uid()}/{filename}
--    (El bucket debe existir previamente — ver nota al inicio)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public read avatars"        ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload avatar" ON storage.objects;
DROP POLICY IF EXISTS "Owners update avatar"        ON storage.objects;
DROP POLICY IF EXISTS "Owners delete avatar"        ON storage.objects;

CREATE POLICY "Public read avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated upload avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Owners update avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING  (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Owners delete avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
