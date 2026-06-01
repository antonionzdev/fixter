-- ============================================================
-- PASO 1: Tabla conversations
-- ============================================================
CREATE TABLE public.conversations (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id      UUID        NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  buyer_id        UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  seller_id       UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Solo una conversación por comprador + anuncio
  CONSTRAINT conversations_buyer_listing_unique UNIQUE (buyer_id, listing_id),
  -- El comprador no puede ser el vendedor
  CONSTRAINT conversations_no_self_chat CHECK (buyer_id <> seller_id)
);

-- Índices para las queries más frecuentes
CREATE INDEX idx_conversations_buyer_id   ON public.conversations (buyer_id);
CREATE INDEX idx_conversations_seller_id  ON public.conversations (seller_id);
CREATE INDEX idx_conversations_listing_id ON public.conversations (listing_id);
CREATE INDEX idx_conversations_last_msg   ON public.conversations (last_message_at DESC NULLS LAST);

-- ============================================================
-- PASO 2: Tabla messages
-- ============================================================
CREATE TABLE public.messages (
  id              UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID           NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id       UUID           NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body            TEXT           NOT NULL CHECK (char_length(body) > 0 AND char_length(body) <= 4000),
  offer_amount    NUMERIC(12, 2) NULL CHECK (offer_amount IS NULL OR offer_amount > 0),
  read_at         TIMESTAMPTZ    NULL,
  created_at      TIMESTAMPTZ    NOT NULL DEFAULT now()
);

-- Índice principal: todos los mensajes de una conversación ordenados por tiempo
CREATE INDEX idx_messages_conversation_created ON public.messages (conversation_id, created_at ASC);
-- Índice parcial para contar no leídos eficientemente
CREATE INDEX idx_messages_unread ON public.messages (conversation_id, read_at) WHERE read_at IS NULL;
-- Índice para queries por remitente
CREATE INDEX idx_messages_sender_id ON public.messages (sender_id);

-- ============================================================
-- PASO 3: Trigger para actualizar last_message_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_conversation_last_message_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_messages_update_last_message_at
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_last_message_at();

-- ============================================================
-- PASO 4: Habilitar RLS
-- ============================================================
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages     ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PASO 5: Políticas RLS — conversations
-- ============================================================

-- Un usuario puede ver una conversación solo si participa en ella
-- (es el comprador O el vendedor). Protege la bandeja de entrada
-- de cada usuario frente al resto.
CREATE POLICY "conversations_select_participants"
  ON public.conversations
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = buyer_id
    OR
    auth.uid() = seller_id
  );

-- Solo el comprador puede iniciar (INSERT) una conversación.
-- Se valida que buyer_id coincide con el usuario autenticado para
-- que nadie pueda crear conversaciones en nombre de otro.
CREATE POLICY "conversations_insert_buyer_only"
  ON public.conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = buyer_id);

-- Ningún usuario puede modificar ni borrar conversaciones desde
-- el cliente; solo el trigger interno (SECURITY DEFINER) actualiza
-- last_message_at. UPDATE y DELETE quedan bloqueados por defecto.

-- ============================================================
-- PASO 6: Políticas RLS — messages
-- ============================================================

-- Un usuario puede ver mensajes solo de conversaciones en las que
-- participa. La subconsulta reutiliza la misma lógica que la
-- política de conversations para no duplicar reglas.
CREATE POLICY "messages_select_participants"
  ON public.messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );

-- Solo un participante de la conversación puede insertar mensajes
-- y el sender_id debe ser su propio UID, impidiendo suplantación.
CREATE POLICY "messages_insert_participants"
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1
      FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );

-- Solo el destinatario (quien NO envió el mensaje) puede marcar
-- un mensaje como leído actualizando read_at.
-- Protege contra que el remitente manipule el estado de lectura del otro.
CREATE POLICY "messages_update_read_at"
  ON public.messages
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() <> sender_id
    AND EXISTS (
      SELECT 1
      FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  )
  -- Solo permite que read_at sea NOT NULL tras el update (no se puede "desmarcar").
  -- La restricción de columnas se aplica vía GRANT (ver abajo).
  WITH CHECK (read_at IS NOT NULL);

-- Ningún usuario puede borrar mensajes desde el cliente.
-- (No se crea política DELETE → denegado por defecto)

-- ============================================================
-- PASO 7: Trigger para validar que seller_id coincide con el
-- vendedor real del anuncio. Previene que un cliente manipule
-- el campo seller_id e inyecte conversaciones falsas en el
-- inbox de usuarios arbitrarios.
-- ============================================================
CREATE OR REPLACE FUNCTION public.validate_conversation_seller()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.listings
    WHERE id = NEW.listing_id AND seller_id = NEW.seller_id
  ) THEN
    RAISE EXCEPTION 'seller_id does not match the actual seller of listing %', NEW.listing_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_conversation_seller
  BEFORE INSERT ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_conversation_seller();

-- ============================================================
-- PASO 8: Permisos de tabla para el rol authenticated.
-- IMPORTANTE: UPDATE en messages se restringe SOLO a la columna
-- read_at para evitar que participantes modifiquen body, sender_id
-- u otras columnas de mensajes ajenos.
-- ============================================================
GRANT SELECT, INSERT ON public.conversations TO authenticated;
GRANT SELECT, INSERT ON public.messages TO authenticated;
-- Columna read_at: solo el destinatario puede marcarla (controlado por RLS)
GRANT UPDATE (read_at) ON public.messages TO authenticated;
