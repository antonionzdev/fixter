-- =============================================================================
-- Fixter: schema del sistema de valoraciones
-- Ejecuta TODO este script en Supabase → SQL Editor → Run
-- =============================================================================

-- -----------------------------------------------------------------------------
-- SECCIÓN 1: ALTER TABLE listings — añadir confirmed_buyer_id
-- Identifica qué comprador cerró la transacción y puede dejar valoración
-- -----------------------------------------------------------------------------

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS confirmed_buyer_id UUID NULL;

-- FK a profiles: si el perfil del comprador se elimina, el campo queda NULL
ALTER TABLE public.listings
  DROP CONSTRAINT IF EXISTS listings_confirmed_buyer_id_fkey;
ALTER TABLE public.listings
  ADD CONSTRAINT listings_confirmed_buyer_id_fkey
  FOREIGN KEY (confirmed_buyer_id)
  REFERENCES public.profiles(id)
  ON DELETE SET NULL;

-- El comprador no puede ser el mismo vendedor del anuncio [C-1]
ALTER TABLE public.listings
  DROP CONSTRAINT IF EXISTS listings_buyer_not_seller;
ALTER TABLE public.listings
  ADD CONSTRAINT listings_buyer_not_seller
  CHECK (confirmed_buyer_id IS NULL OR confirmed_buyer_id <> seller_id);

-- Solo se puede asignar comprador cuando el anuncio está vendido [M-3]
ALTER TABLE public.listings
  DROP CONSTRAINT IF EXISTS listings_sold_if_buyer_set;
ALTER TABLE public.listings
  ADD CONSTRAINT listings_sold_if_buyer_set
  CHECK (confirmed_buyer_id IS NULL OR status = 'sold');

-- -----------------------------------------------------------------------------
-- SECCIÓN 2: Policy de UPDATE para confirmed_buyer_id en listings
--
-- ADVERTENCIA SOBRE POLICIES EXISTENTES:
-- La tabla listings ya tiene "Owners update own listings" con:
--   USING (auth.uid() = seller_id)
--   WITH CHECK (auth.uid() = seller_id)
-- Esa policy cubre el UPDATE general (editar título, precio, etc.).
-- Supabase evalúa múltiples policies FOR UPDATE con OR (cualquiera que pase
-- permite la operación). Para asegurar que confirmed_buyer_id solo se puede
-- poner cuando status = 'sold', se reemplaza la policy general de UPDATE
-- por una que incluya esa restricción. Si prefieres mantener la policy
-- general sin cambios, la policy aditiva de abajo es suficiente para proteger
-- el campo a nivel de lógica de aplicación; la RLS base (seller_id = auth.uid())
-- ya impide que otros usuarios modifiquen el listing.
--
-- Esta policy es ADITIVA: no toca las existentes SELECT/INSERT/DELETE.
-- -----------------------------------------------------------------------------

-- Eliminar la policy general de UPDATE existente y reemplazarla por una
-- que también exige status = 'sold' cuando se establece confirmed_buyer_id.
-- Si NO quieres reemplazar la policy existente, comenta las líneas DROP/CREATE
-- y deja solo la nota como recordatorio.

DROP POLICY IF EXISTS "Owners update own listings" ON public.listings;

-- Permite al vendedor actualizar su propio anuncio.
-- WITH CHECK garantiza que si confirmed_buyer_id se rellena, status debe ser 'sold'.
CREATE POLICY "Owners update own listings"
ON public.listings
FOR UPDATE
TO authenticated
-- USING: solo el vendedor puede intentar el UPDATE
USING (auth.uid() = seller_id)
-- WITH CHECK: si se está confirmando un comprador, el status debe ser 'sold' al mismo tiempo
WITH CHECK (
  auth.uid() = seller_id
  AND (
    -- Actualización normal (sin confirmar comprador): siempre permitida al vendedor
    confirmed_buyer_id IS NULL
    OR
    -- Confirmar comprador: solo cuando status = 'sold' en el mismo UPDATE
    status = 'sold'
  )
);

-- -----------------------------------------------------------------------------
-- SECCIÓN 2b: Trigger — impide reasignar confirmed_buyer_id si ya existe review [M-2]
-- Una vez que un comprador ha dejado valoración, el campo es inmutable.
-- Esto evita que el vendedor asigne un segundo comprador para acumular reviews extra.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.prevent_buyer_reassignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Solo actúa cuando confirmed_buyer_id cambia y ya tenía un valor
  IF OLD.confirmed_buyer_id IS DISTINCT FROM NEW.confirmed_buyer_id
    AND OLD.confirmed_buyer_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.reviews WHERE listing_id = NEW.id
    )
  THEN
    RAISE EXCEPTION
      'confirmed_buyer_id no puede reasignarse: ya existe una valoración para este anuncio';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_buyer_reassignment_trigger ON public.listings;
CREATE TRIGGER prevent_buyer_reassignment_trigger
  BEFORE UPDATE ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_buyer_reassignment();

-- -----------------------------------------------------------------------------
-- SECCIÓN 3: CREATE TABLE reviews
-- Una valoración por transacción (comprador → vendedor), solo tras venta confirmada
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.reviews (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id        UUID        NOT NULL
    REFERENCES public.listings(id) ON DELETE CASCADE,
  reviewer_id       UUID        NOT NULL
    REFERENCES public.profiles(id) ON DELETE CASCADE,    -- el comprador que valora
  reviewed_id       UUID        NOT NULL
    REFERENCES public.profiles(id) ON DELETE CASCADE,    -- el vendedor valorado
  rating            INTEGER     NOT NULL
    CONSTRAINT reviews_rating_range CHECK (rating >= 1 AND rating <= 5),
  comment           TEXT        NULL
    CONSTRAINT reviews_comment_length CHECK (comment IS NULL OR length(comment) <= 1000),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Una sola valoración por transacción (un comprador no puede valorar dos veces)
  CONSTRAINT reviews_unique_per_transaction UNIQUE (listing_id, reviewer_id),
  -- El comprador no puede valorarse a sí mismo
  CONSTRAINT reviews_no_self_review CHECK (reviewer_id <> reviewed_id)
);

-- -----------------------------------------------------------------------------
-- SECCIÓN 4: Activar RLS en reviews
-- -----------------------------------------------------------------------------

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- SECCIÓN 5: RLS policies para reviews
-- -----------------------------------------------------------------------------

-- Lectura pública: cualquiera puede ver las valoraciones (perfil público del vendedor)
DROP POLICY IF EXISTS "Public read reviews" ON public.reviews;
CREATE POLICY "Public read reviews"
ON public.reviews
FOR SELECT
TO anon, authenticated
USING (true);

-- INSERT: solo el comprador confirmado de esa transacción puede crear la valoración.
-- Verifica que: (1) el reviewer es el usuario autenticado, y (2) existe un listing
-- con ese id, confirmado como vendido con ese mismo comprador como confirmed_buyer_id.
DROP POLICY IF EXISTS "Confirmed buyer can insert review" ON public.reviews;
CREATE POLICY "Confirmed buyer can insert review"
ON public.reviews
FOR INSERT
TO authenticated
WITH CHECK (
  -- El que inserta debe ser el reviewer
  auth.uid() = reviewer_id
  -- Y debe existir un listing vendido donde: el comprador confirmado es el reviewer
  -- Y el vendedor real del listing es el reviewed_id declarado en la review [C-1]
  AND EXISTS (
    SELECT 1
    FROM public.listings l
    WHERE l.id = listing_id
      AND l.status = 'sold'
      AND l.confirmed_buyer_id = auth.uid()
      AND l.seller_id = reviewed_id
  )
);

-- UPDATE bloqueado: no se añade ninguna policy FOR UPDATE → RLS deniega por defecto.
-- DELETE bloqueado: no se añade ninguna policy FOR DELETE → RLS deniega por defecto.

-- -----------------------------------------------------------------------------
-- SECCIÓN 6: Permisos de rol
-- -----------------------------------------------------------------------------

GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT INSERT ON public.reviews TO authenticated;
-- UPDATE y DELETE no se conceden: las valoraciones son permanentes

-- -----------------------------------------------------------------------------
-- SECCIÓN 7: Índices
-- Optimizan las queries más frecuentes del sistema de valoraciones
-- -----------------------------------------------------------------------------

-- Para cargar el perfil de un vendedor: "¿cuántas valoraciones tiene este vendedor?"
CREATE INDEX IF NOT EXISTS reviews_reviewed_id_idx
  ON public.reviews (reviewed_id);

-- Para verificar si ya existe valoración para un listing concreto
CREATE INDEX IF NOT EXISTS reviews_listing_id_idx
  ON public.reviews (listing_id);

-- Para cargar todas las valoraciones hechas por un usuario (historial del comprador)
CREATE INDEX IF NOT EXISTS reviews_reviewer_id_idx
  ON public.reviews (reviewer_id);
