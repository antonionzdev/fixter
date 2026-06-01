// Tipos para el sistema de valoraciones de Fixter
// Tabla: public.reviews

// Fila exacta tal como la devuelve Supabase (todos los campos de la tabla)
export type ReviewRow = {
  id: string;
  listing_id: string;
  reviewer_id: string;   // el comprador que deja la valoración
  reviewed_id: string;   // el vendedor valorado
  rating: number;        // 1–5
  comment: string | null;
  created_at: string;
};

// Campos necesarios para INSERT (id y created_at los genera la base de datos)
export type ReviewInsert = {
  listing_id: string;
  reviewer_id: string;
  reviewed_id: string;
  rating: number;
  comment?: string | null;
};

// ReviewRow enriquecida con datos del perfil del reviewer
// Sigue el mismo patrón plano de ListingDetailWithSeller en lib/types/listing.ts
// Se obtiene con un join: reviews.select('*, profiles!reviewer_id(username, avatar_url)')
export type ReviewWithReviewer = ReviewRow & {
  reviewer_username: string;
  reviewer_avatar_url: string | null;
};

// Para mostrar en el perfil del vendedor: incluye reviewer + título del listing
export type ReviewWithDetails = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer_username: string;
  reviewer_avatar_url: string | null;
  listing_title: string;
};
