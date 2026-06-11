-- =============================================================================
-- FIXTER SECURITY HARDENING — 2026-06-04
-- Auditoría de seguridad extrema pre-lanzamiento (sistema de pagos Stripe).
-- Ejecutar TODO este script en Supabase Dashboard → SQL Editor → Run.
-- Idempotente: puede re-ejecutarse sin efectos colaterales.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- [P0-1] EXCLUSIVIDAD DE COMPRA — una sola orden "viva" por anuncio.
--
-- PROBLEMA: create-payment-intent solo comprobaba órdenes activas del MISMO
-- comprador. Dos compradores distintos podían crear PaymentIntents y pagar
-- simultáneamente el mismo artículo físico (doble venta). Además existía una
-- race condition (TOCTOU): dos peticiones concurrentes del mismo comprador
-- pasaban la comprobación y creaban dos órdenes.
--
-- SOLUCIÓN: índice único parcial. La base de datos garantiza que solo puede
-- existir UNA orden en estado "vivo" (que retiene fondos o compromete el
-- artículo) por listing_id. El segundo INSERT concurrente falla con 23505 y la
-- API cancela el PaymentIntent sobrante.
-- -----------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS orders_one_active_per_listing
  ON public.orders (listing_id)
  WHERE status IN (
    'pending_payment','paid','shipped','delivered','completed','disputed'
  );


-- -----------------------------------------------------------------------------
-- [P0-2] PROFILES — bloquear escritura de columnas sensibles desde el cliente.
--
-- PROBLEMA: la policy "Users update own profile" (USING/WITH CHECK auth.uid()=id)
-- permitía a un usuario autenticado actualizar CUALQUIER columna de su propia
-- fila, incluyendo stripe_account_id y stripe_onboarding_complete. Un vendedor
-- podía marcarse stripe_onboarding_complete=true sin onboarding real o apuntar
-- stripe_account_id a una cuenta arbitraria — desincronizando el estado de pagos
-- de la realidad de Stripe e induciendo transferencias/errores.
--
-- SOLUCIÓN: privilegios a nivel de columna. authenticated solo puede modificar
-- los campos de perfil legítimos. Los campos Stripe los gestiona EXCLUSIVAMENTE
-- el service_role desde las API routes de Connect (connect/onboard, connect/verify).
-- service_role no se ve afectado por estos REVOKE (tiene sus propios privilegios).
-- -----------------------------------------------------------------------------
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (username, full_name, avatar_url, bio, location, phone)
  ON public.profiles TO authenticated;


-- -----------------------------------------------------------------------------
-- [P1] PROFILES — exposición masiva de PII (teléfono + stripe_account_id).
--
-- PROBLEMA: la policy "Public read profiles" (USING (true)) + GRANT SELECT sobre
-- TODAS las columnas permitía a CUALQUIER usuario (incluso anónimo) recolectar
-- el teléfono y el stripe_account_id de TODOS los usuarios con una sola query
-- desde el SDK del navegador:
--   supabase.from('profiles').select('phone, stripe_account_id')
--
-- SOLUCIÓN: privilegios SELECT a nivel de columna. anon/authenticated solo leen
-- columnas estrictamente públicas. El teléfono propio y los campos Stripe propios
-- se leen vía service_role en el servidor (ver app/profile/edit y dashboard/connect).
-- La policy USING(true) se mantiene (controla qué FILAS, no qué COLUMNAS).
-- -----------------------------------------------------------------------------
REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (id, username, full_name, avatar_url, bio, location, created_at)
  ON public.profiles TO anon, authenticated;


-- -----------------------------------------------------------------------------
-- [P1] LISTINGS — el precio debe ser estrictamente positivo.
--
-- PROBLEMA: no existía CHECK sobre listings.price. Un usuario podía insertar un
-- anuncio con precio 0 o negativo vía el SDK del navegador (la RLS de INSERT solo
-- valida seller_id = auth.uid()).
--
-- SOLUCIÓN: CHECK (price > 0). NOT VALID para no romper filas de seed existentes;
-- valida filas nuevas inmediatamente. Tras sanear datos, ejecutar:
--   ALTER TABLE public.listings VALIDATE CONSTRAINT listings_price_positive;
-- -----------------------------------------------------------------------------
ALTER TABLE public.listings
  DROP CONSTRAINT IF EXISTS listings_price_positive;
ALTER TABLE public.listings
  ADD CONSTRAINT listings_price_positive CHECK (price > 0) NOT VALID;


-- -----------------------------------------------------------------------------
-- [P1] STRIPE WEBHOOKS — idempotencia + auditoría forense.
--
-- PROBLEMA: el webhook no registraba los eventos procesados. Stripe reintenta y
-- reenvía eventos; sin deduplicación, un replay podía reprocesar transiciones.
-- Tampoco existía traza financiera de qué eventos llegaron (requisito forense).
--
-- SOLUCIÓN: tabla append-only de eventos. El webhook hace INSERT con el event.id
-- como PK ANTES de procesar; si ya existe (replay), responde 200 sin reprocesar.
-- RLS activa sin policies: ningún cliente (anon/authenticated) puede leerla;
-- solo service_role (bypass RLS) la usa desde el webhook.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stripe_events (
  id                TEXT PRIMARY KEY,           -- event.id de Stripe (evt_...)
  type              TEXT NOT NULL,
  payment_intent_id TEXT NULL,
  processed_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS stripe_events_pi_idx
  ON public.stripe_events (payment_intent_id);

ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;
-- Sin policies a propósito: la tabla es solo para el service_role.
GRANT ALL ON public.stripe_events TO service_role;


-- -----------------------------------------------------------------------------
-- [P1] ESCROW — auto-liberación coherente.
--
-- PROBLEMA: los PaymentIntent con capture_method=manual se cancelan
-- automáticamente en Stripe a los 7 días si no se capturan. La función previa
-- auto_complete_delivered_orders() solo cambiaba el status en la DB a 'completed'
-- pero NUNCA capturaba el pago en Stripe, y dependía de delivered_at, que ningún
-- flujo rellenaba. Resultado: el vendedor podía no cobrar nunca y el escrow
-- expiraba.
--
-- SOLUCIÓN: la captura real la realiza la ruta POST /api/stripe/auto-capture
-- (server, llama a stripe.paymentIntents.capture). Esta función queda como
-- ayuda de marcado y se reescribe para NO tocar dinero. Programar la ruta con un
-- scheduler externo (Vercel Cron / GitHub Actions / Supabase pg_cron+http) que
-- envíe Authorization: Bearer ${CRON_SECRET}.
-- -----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.auto_complete_delivered_orders();

-- (Opcional) marca como 'delivered' a partir de 'shipped' tras una ventana, para
-- que la ruta de auto-captura tenga una señal temporal. No mueve dinero.
CREATE OR REPLACE FUNCTION public.mark_shipped_as_delivered()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.orders
  SET status = 'delivered',
      delivered_at = COALESCE(delivered_at, NOW())
  WHERE status = 'shipped'
    AND updated_at < NOW() - INTERVAL '72 hours';
END;
$$;


-- =============================================================================
-- ESTADO FINAL ESPERADO TRAS ESTE SCRIPT
--
-- public.orders
--   + índice único parcial orders_one_active_per_listing (1 orden viva/anuncio)
--   SELECT: buyer o seller; INSERT/UPDATE/DELETE: solo service_role
--
-- public.profiles
--   SELECT (anon, authenticated): id, username, full_name, avatar_url, bio,
--                                 location, created_at  (sin phone ni stripe_*)
--   UPDATE (authenticated): username, full_name, avatar_url, bio, location, phone
--                           (sin stripe_account_id ni stripe_onboarding_complete)
--   phone / stripe_* : solo service_role
--
-- public.listings
--   + CHECK listings_price_positive (price > 0, NOT VALID)
--
-- public.stripe_events  (NUEVA)
--   RLS on, sin policies; solo service_role. Idempotencia + auditoría.
-- =============================================================================
