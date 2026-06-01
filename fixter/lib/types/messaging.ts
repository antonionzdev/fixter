/** Fila cruda de la tabla public.conversations */
export interface ConversationRow {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  last_message_at: string | null; // ISO 8601
  created_at: string;
}

/** Fila cruda de la tabla public.messages */
export interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  offer_amount: number | null;
  read_at: string | null; // null = no leído
  created_at: string;
}

/** Perfil mínimo del participante de una conversación */
export interface ConversationParticipant {
  id: string;
  username: string;
  avatar_url: string | null;
}

/** Listing mínimo visible en la conversación */
export interface ConversationListing {
  id: string;
  title: string;
  first_image: string | null; // primera URL del array images[], null si no tiene
  price: number;
}

/**
 * Conversación enriquecida con datos de la listing y los participantes.
 * Resultado de un JOIN entre conversations + listings + profiles (x2).
 * Usar esta vista en la bandeja de entrada y en la pantalla de chat.
 */
export interface ConversationWithDetails extends ConversationRow {
  listing: ConversationListing;
  buyer: ConversationParticipant;
  seller: ConversationParticipant;
  unread_count: number; // calculado en la query, no en DB
}

/**
 * Payload para insertar un mensaje nuevo.
 * No incluir id, created_at ni read_at — los genera la DB.
 */
export interface MessageInsert {
  conversation_id: string;
  sender_id: string; // debe coincidir con auth.uid()
  body: string;
  offer_amount?: number | null;
}
