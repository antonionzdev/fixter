-- ======================================================
-- FIXTER — Sistema de Pagos
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ======================================================

-- 1. Añadir campos Stripe Connect a profiles
-- ======================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_account_id TEXT NULL,
  ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Tabla orders
-- ======================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id               UUID NOT NULL REFERENCES public.listings(id) ON DELETE RESTRICT,
  buyer_id                 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  seller_id                UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  amount                   NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  commission_amount        NUMERIC(10,2) NOT NULL CHECK (commission_amount >= 0),
  shipping_amount          NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (shipping_amount >= 0),
  total_amount             NUMERIC(10,2) NOT NULL CHECK (total_amount > 0),
  stripe_payment_intent_id TEXT UNIQUE NOT NULL,
  status                   TEXT NOT NULL DEFAULT 'pending_payment'
                             CHECK (status IN (
                               'pending_payment','paid','shipped',
                               'delivered','completed','disputed',
                               'refunded','cancelled'
                             )),
  tracking_number          TEXT NULL,
  carrier                  TEXT NULL,
  delivered_at             TIMESTAMPTZ NULL,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT orders_buyer_not_seller CHECK (buyer_id <> seller_id)
);

-- 3. Tabla disputes
-- ======================================================
CREATE TABLE IF NOT EXISTS public.disputes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  buyer_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  dispute_type      TEXT NOT NULL CHECK (dispute_type IN (
                      'not-received','damaged','wrong-item',
                      'incorrect','incomplete','other'
                    )),
  description       TEXT NOT NULL CHECK (char_length(description) BETWEEN 10 AND 2000),
  evidence_urls     TEXT[] NOT NULL DEFAULT '{}',
  status            TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN (
                        'pending','under_review',
                        'resolved_buyer','resolved_seller','closed'
                      )),
  resolution_notes  TEXT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Índices
-- ======================================================
CREATE INDEX IF NOT EXISTS orders_buyer_id_idx         ON public.orders(buyer_id);
CREATE INDEX IF NOT EXISTS orders_seller_id_idx        ON public.orders(seller_id);
CREATE INDEX IF NOT EXISTS orders_listing_id_idx       ON public.orders(listing_id);
CREATE INDEX IF NOT EXISTS orders_status_idx           ON public.orders(status);
CREATE INDEX IF NOT EXISTS orders_stripe_pi_idx        ON public.orders(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS orders_delivered_at_idx     ON public.orders(delivered_at) WHERE delivered_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS disputes_order_id_idx       ON public.disputes(order_id);
CREATE INDEX IF NOT EXISTS disputes_buyer_id_idx       ON public.disputes(buyer_id);

-- 5. Trigger updated_at
-- ======================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_disputes_updated_at ON public.disputes;
CREATE TRIGGER trg_disputes_updated_at
  BEFORE UPDATE ON public.disputes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. RLS
-- ======================================================
ALTER TABLE public.orders   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

-- orders: el comprador ve sus pedidos
DROP POLICY IF EXISTS "orders_select_buyer"  ON public.orders;
CREATE POLICY "orders_select_buyer"  ON public.orders FOR SELECT
  USING (auth.uid() = buyer_id);

-- orders: el vendedor ve sus ventas
DROP POLICY IF EXISTS "orders_select_seller" ON public.orders;
CREATE POLICY "orders_select_seller" ON public.orders FOR SELECT
  USING (auth.uid() = seller_id);

-- orders INSERT y UPDATE críticos se hacen desde API routes con service_role
-- No se exponen al cliente anónimo/autenticado intencionadamente

-- disputes: el comprador ve sus reclamaciones
DROP POLICY IF EXISTS "disputes_select_buyer"  ON public.disputes;
CREATE POLICY "disputes_select_buyer"  ON public.disputes FOR SELECT
  USING (auth.uid() = buyer_id);

-- disputes: el vendedor ve reclamaciones sobre sus pedidos
DROP POLICY IF EXISTS "disputes_select_seller" ON public.disputes;
CREATE POLICY "disputes_select_seller" ON public.disputes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = disputes.order_id
        AND orders.seller_id = auth.uid()
    )
  );

-- 7. pg_cron: auto-captura a las 48h de estado "delivered"
-- Requiere extensión pg_cron habilitada en Supabase Dashboard
-- Ir a: Database → Extensions → activar pg_cron
-- ======================================================
-- La función marca como "completed" los pedidos en "delivered"
-- con delivered_at hace más de 48h (la captura real la hace el webhook)
CREATE OR REPLACE FUNCTION public.auto_complete_delivered_orders()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.orders
  SET status = 'completed'
  WHERE status = 'delivered'
    AND delivered_at IS NOT NULL
    AND delivered_at < NOW() - INTERVAL '48 hours';
END;
$$;

-- Cron: ejecutar cada hora
-- SELECT cron.schedule('auto-complete-orders', '0 * * * *', 'SELECT public.auto_complete_delivered_orders()');
-- Para cancelar: SELECT cron.unschedule('auto-complete-orders');
