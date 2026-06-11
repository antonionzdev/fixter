-- =============================================================================
-- FIXTER SECURITY HARDENING — 2026-06-03
-- Estas dos migraciones ya fueron aplicadas vía MCP al proyecto de producción.
-- Este archivo es referencia para reproducir el estado en entornos nuevos.
-- =============================================================================

-- -------------------------------------------------------------------------
-- MIGRACIÓN 1: fix_reviews_rls
-- Problema A: "Authenticated insert review" permitía a cualquier usuario
--   autenticado valorar a cualquier otra persona sin ser parte de la transacción.
-- Problema B: El rol authenticated tenía GRANT UPDATE y DELETE sobre reviews,
--   y las policies "Owners update review" / "Owners delete review" permitían
--   modificar o borrar valoraciones publicadas.
-- Problema C: La policy bidireccional (vendedor puede valorar al comprador)
--   nunca fue aplicada a producción.
-- -------------------------------------------------------------------------

DROP POLICY IF EXISTS "Authenticated insert review"       ON public.reviews;
DROP POLICY IF EXISTS "Confirmed buyer can insert review" ON public.reviews;
DROP POLICY IF EXISTS "Owners update review"              ON public.reviews;
DROP POLICY IF EXISTS "Owners delete review"              ON public.reviews;

REVOKE UPDATE, DELETE ON public.reviews FROM authenticated;

CREATE POLICY "Transaction participants can insert review"
ON public.reviews
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = reviewer_id
  AND EXISTS (
    SELECT 1
    FROM public.listings l
    WHERE l.id = listing_id
      AND l.status = 'sold'
      AND l.confirmed_buyer_id IS NOT NULL
      AND (
        (l.confirmed_buyer_id = auth.uid() AND l.seller_id = reviewed_id)
        OR
        (l.seller_id = auth.uid() AND l.confirmed_buyer_id = reviewed_id)
      )
  )
);

-- -------------------------------------------------------------------------
-- MIGRACIÓN 2: fix_offers_insert_rls
-- Problema: La policy INSERT solo verificaba auth.uid() = buyer_id, lo que
--   permitía a cualquier usuario insertar una oferta en cualquier conversación
--   poniéndose a sí mismo como buyer_id, aunque fuera el vendedor o no
--   participara en la conversación.
-- -------------------------------------------------------------------------

DROP POLICY IF EXISTS "offers_insert" ON public.offers;

CREATE POLICY "offers_insert"
ON public.offers
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = buyer_id
  AND EXISTS (
    SELECT 1
    FROM public.conversations c
    WHERE c.id = conversation_id
      AND c.buyer_id = auth.uid()
  )
);

-- -------------------------------------------------------------------------
-- ESTADO FINAL VERIFICADO EN PRODUCCIÓN (tras sesión 2026-06-03)
--
-- public.reviews
--   SELECT : "Public read reviews"                    → true (público)
--   INSERT : "Transaction participants can insert review" → bidireccional
--   UPDATE : sin policy (bloqueado por defecto)
--   DELETE : sin policy (bloqueado por defecto)
--   GRANTs : SELECT, INSERT para authenticated
--
-- public.offers
--   SELECT : "offers_select" → buyer_id = uid OR seller_id = uid
--   INSERT : "offers_insert" → buyer_id = uid AND (buyer OR seller de la conversación)
--   UPDATE : "offers_update" → seller_id = uid (solo el vendedor acepta/rechaza)
--   Trigger: trg_validate_offer (SECURITY DEFINER) → max 10/día, 1 pending/conv
--   Checks : amount > 0, counter_amount > 0, status IN (...)
--
-- public.listings
--   SELECT : "Anuncios activos son públicos" → status = 'active'
--            "listings_select_seller"        → auth.uid() = seller_id
--            "listings_select_confirmed_buyer" → auth.uid() = confirmed_buyer_id
--   INSERT : "Usuarios autenticados pueden publicar" → auth.uid() = seller_id
--   UPDATE : "Owners update own listings" → seller_id=uid AND (confirmed_buyer_id IS NULL OR status='sold')
--   DELETE : "Vendedor puede eliminar su anuncio" → auth.uid() = seller_id
--
-- public.conversations
--   SELECT : "conversations_select_participants" → buyer_id=uid OR seller_id=uid
--   INSERT : "conversations_insert" → buyer_id=uid AND uid<>seller_id
--             AND EXISTS(listing where seller_id matches AND status='active')
--
-- public.messages
--   SELECT : "messages_select_participants" → EXISTS(conv participante)
--   INSERT : "messages_insert_participants" → sender_id=uid AND EXISTS(conv participante)
--   UPDATE : "messages_update_read_at" → USING: uid<>sender_id AND participante
--             WITH CHECK: read_at IS NOT NULL (solo marcar como leído)
-- -------------------------------------------------------------------------
