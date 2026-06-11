-- =============================================================================
-- Fixter: habilitar valoraciones bidireccionales (vendedor → comprador)
-- Ejecuta en Supabase → SQL Editor → Run
-- =============================================================================

-- Reemplaza la policy existente que solo permitía al comprador valorar al vendedor.
-- La nueva policy permite también al vendedor valorar al comprador confirmado.
-- La restricción UNIQUE(listing_id, reviewer_id) ya evita reviews duplicadas.

DROP POLICY IF EXISTS "Confirmed buyer can insert review" ON public.reviews;

CREATE POLICY "Transaction participants can insert review"
ON public.reviews
FOR INSERT
TO authenticated
WITH CHECK (
  -- El reviewer debe ser el usuario autenticado
  auth.uid() = reviewer_id
  -- Y debe existir un listing vendido donde auth.uid() participó como comprador o vendedor
  AND EXISTS (
    SELECT 1
    FROM public.listings l
    WHERE l.id = listing_id
      AND l.status = 'sold'
      AND (
        -- Caso 1: el reviewer es el comprador confirmado, valorando al vendedor
        (l.confirmed_buyer_id = auth.uid() AND l.seller_id = reviewed_id)
        OR
        -- Caso 2: el reviewer es el vendedor, valorando al comprador confirmado
        (l.seller_id = auth.uid() AND l.confirmed_buyer_id = reviewed_id)
      )
  )
);
