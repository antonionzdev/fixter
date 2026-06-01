@AGENTS.md

# Fixter — Contexto de proyecto

Marketplace de segunda mano especializado en piezas de reparación de smartphones (España/LATAM, UI en español, locale es-ES).

---

## Stack

- **Next.js 16.2.6** con App Router — `next dev --webpack` (Turbopack desactivado)
- **React 19.2.4**
- **TypeScript 5**, `strict: true`
- **Tailwind CSS 4** via `@tailwindcss/postcss`
- **Supabase**: `@supabase/ssr` ^0.10.3 + `@supabase/supabase-js` ^2.106.2
- Sin Server Actions, sin API Routes propias — writes van por Client Components con SDK browser

---

## Los tres clientes de Supabase

| Archivo | Exporta | Cuándo usarlo |
|---------|---------|---------------|
| `lib/supabase.ts` | `getSupabase()` | Client Components |
| `lib/supabase-server.ts` | `createServerSupabase()` | Queries públicas de lectura (siempre anon) |
| `lib/supabase-server-auth.ts` | `createAuthServerSupabase()` | Cuando necesitas saber quién es el usuario en el servidor |

`createServerSupabase()` es 100% anónimo — nunca usarlo para verificar sesión.

---

## Mapa de archivos

### `app/`

| Archivo | Tipo | Qué hace |
|---------|------|----------|
| `app/page.tsx` | Server | Home. Parsea searchParams → `getLatestListings(48, filters)` → grid de ProductCard |
| `app/layout.tsx` | Server | Root layout, metadata global |
| `app/publish/page.tsx` | Server | Protegida. Redirige a `/login?redirect=/publish` si no hay sesión |
| `app/dashboard/page.tsx` | Server | Protegida. Tabs activos/vendidos/compras. Queries paralelas: listings propios + purchases como buyer + reviews |
| `app/dashboard/ListingActions.tsx` | Client | Marcar vendido (abre modal), eliminar, editar |
| `app/dashboard/dashboard-listing-card.tsx` | Server | Card de anuncio en dashboard |
| `app/listings/[id]/page.tsx` | Server | Detalle. `cache(getListingById)` deduplica query entre generateMetadata y componente |
| `app/listings/[id]/edit/page.tsx` | Server | Protegida. Verifica sesión y propiedad. Renderiza EditListingForm |
| `app/profile/[username]/page.tsx` | Server | Perfil público. `isOwner = authUser.id === profile.id`. Listings + reviews en Promise.all |
| `app/profile/edit/page.tsx` | Server | Protegida. Edición del propio perfil. Precede a `[username]` |
| `app/messages/layout.tsx` | Server | Auth check + fetch conversaciones para sidebar. Aplica a `/messages` y `/messages/[id]` |
| `app/messages/page.tsx` | Server | Desktop: empty state. Móvil: nunca visible (MessagesShell muestra sidebar) |
| `app/messages/[conversationId]/page.tsx` | Server | Chat. Auth check, query conversación, mensajes iniciales, mark-as-read server-side |
| `app/(auth)/login/page.tsx` | — | LoginForm, acepta `?redirect=` |
| `app/(auth)/register/page.tsx` | — | RegisterForm |

### `components/`

| Archivo | Tipo | Qué hace |
|---------|------|----------|
| `components/layout/site-header.tsx` | Server | Header sticky |
| `components/layout/site-header-nav.tsx` | Client | Nav con auth dinámica. useEffect + getSession() |
| `components/layout/site-header-search.tsx` | Client | Input search → router.push con `?search=` |
| `components/listings/product-card.tsx` | Server | Card en home. Recibe ListingWithSeller |
| `components/listings/marketplace-listing-card.tsx` | Server | Card en perfil de vendedor |
| `components/listings/publish-form.tsx` | Client | Formulario publicación. Upload + insert inline. Limpia Storage si falla |
| `components/listings/edit-listing-form.tsx` | Client | Formulario edición. Datos precargados. Gestión de imágenes |
| `components/listings/search-filters.tsx` | Client | Panel filtros colapsable. Replica arrays de publish-form |
| `components/listings/listing-detail-view.tsx` | Server | Vista detalle con galería, specs, info vendedor |
| `components/listings/listing-gallery.tsx` | Client | Galería con main + thumbnails |
| `components/listings/contact-seller-button.tsx` | Client | Crea o navega a conversación existente. Oculto si es el propio vendedor |
| `components/listings/condition-badge.tsx` | Server | Badge con color por condición |
| `components/listings/image-upload-field.tsx` | Client | ⚠️ Dead code — no se importa en ningún sitio |
| `components/auth/register-form.tsx` | Client | signUp() → ensureUserProfile() |
| `components/auth/login-form.tsx` | Client | signInWithPassword() → ensureUserProfile() |
| `components/profile/profile-header.tsx` | Server | Avatar, username, bio, localidad, StarRating, count anuncios |
| `components/profile/profile-edit-form.tsx` | Client | Edición perfil. Avatar upload a bucket `avatars` |
| `components/profile/profile-page-client.tsx` | Client | Gestiona vista/edición inline. `isOwner` controla controles. Listings + reviewsSection como slots |
| `components/profile/star-rating.tsx` | Client | 5 estrellas SVG. Props: rating, count, size |
| `components/profile/reviews-list.tsx` | Server | Lista de valoraciones recibidas. Recibe `ReviewWithDetails[]` como prop |
| `components/dashboard/mark-as-sold-modal.tsx` | Client | Modal para confirmar venta: carga compradores de conversations, selecciona confirmed_buyer_id |
| `components/dashboard/purchase-card.tsx` | Client | Card de compra en tab "Compras". Estado local de review. Abre ReviewFormModal |
| `components/dashboard/review-form-modal.tsx` | Client | Formulario de valoración: 5 estrellas + textarea. INSERT en reviews |
| `components/messages/messages-shell.tsx` | Client | Layout dos columnas. usePathname() decide vista móvil/desktop |
| `components/messages/chat-view.tsx` | Client | Chat Realtime. initialMessages → useState. Suscripción postgres_changes |

### `lib/`

| Archivo | Qué exporta |
|---------|-------------|
| `lib/supabase.ts` | `getSupabase()` |
| `lib/supabase-server.ts` | `createServerSupabase()` |
| `lib/supabase-server-auth.ts` | `createAuthServerSupabase()` |
| `lib/listings.ts` | `uploadListingImages()`, `createListing()`, `validatePublishInput()` — ⚠️ dead code, publish-form no los usa |
| `lib/listings-queries.ts` | `getLatestListings()`, `getListingById()`, `applyFilters()` |
| `lib/profiles.ts` | `ensureUserProfile()`, `ensureUserProfileById()` |
| `lib/profile-queries.ts` | `getProfileByUsername()`, `getActiveListingsBySellerId()`, `getReviewSummary()`, `getReviewsByProfileId()` |
| `lib/profile-utils.ts` | `getSellerDisplayName()`, `normalizeProfile()` |
| `lib/format.ts` | `formatPrice()`, `formatRelativeTime()`, `formatMemberSince()` — locale es-ES |
| `lib/auth-errors.ts` | `getAuthErrorMessage()` — errores Supabase Auth en español |
| `lib/constants/categories.ts` | `LISTING_CATEGORIES`, `LISTING_CONDITIONS`, `LISTING_IMAGES_BUCKET`, `MAX_LISTING_IMAGES=8` |
| `lib/types/listing.ts` | `ListingRow`, `ListingWithSeller`, `ListingDetailWithSeller`, `ListingFilters`, `PublishListingInput` |
| `lib/types/profile.ts` | `PublicProfile`, `ReviewSummary` |
| `lib/types/messaging.ts` | `ConversationRow`, `MessageRow`, `ConversationWithDetails`, `MessageInsert` |
| `lib/types/reviews.ts` | `ReviewRow`, `ReviewInsert`, `ReviewWithReviewer`, `ReviewWithDetails` |

---

## Schema de base de datos

```sql
public.profiles
  id UUID PK FK auth.users.id | username TEXT | full_name TEXT | avatar_url TEXT
  location TEXT | bio TEXT | phone TEXT | created_at TIMESTAMPTZ

public.listings
  id UUID PK | seller_id UUID FK profiles.id | title TEXT | description TEXT
  price NUMERIC | category TEXT | model TEXT | condition TEXT | location TEXT
  images TEXT[] | specs JSONB | status TEXT ("active"|"sold") | created_at TIMESTAMPTZ
  confirmed_buyer_id UUID NULL FK profiles.id ON DELETE SET NULL
  -- category slugs: "pantallas","baterias","camaras","conectores","carcasas","moviles_despiece","otros_componentes"
  -- condition slugs: "nuevo","como_nuevo","bueno","aceptable"
  -- confirmed_buyer_id: solo el vendedor puede setearlo, solo junto a status='sold', y no puede ser seller_id

public.reviews
  id UUID PK | listing_id UUID FK listings.id ON DELETE CASCADE
  reviewer_id UUID FK profiles.id ON DELETE CASCADE  -- el comprador que valora
  reviewed_id UUID FK profiles.id ON DELETE CASCADE  -- el vendedor valorado
  rating INTEGER CHECK(1-5) | comment TEXT NULL CHECK(length<=1000) | created_at TIMESTAMPTZ
  UNIQUE(listing_id, reviewer_id) | CHECK(reviewer_id <> reviewed_id)

public.conversations
  id UUID PK | listing_id UUID FK | buyer_id UUID FK | seller_id UUID FK
  last_message_at TIMESTAMPTZ | created_at TIMESTAMPTZ
  UNIQUE(buyer_id, listing_id) | CHECK(buyer_id <> seller_id)

public.messages
  id UUID PK | conversation_id UUID FK | sender_id UUID FK
  body TEXT (1-4000) | offer_amount NUMERIC(12,2) NULL | read_at TIMESTAMPTZ NULL
  created_at TIMESTAMPTZ

-- Storage buckets: listing-images / avatars
-- Path listing-images: {auth.uid()}/{batchId}/{uuid}-{filename}
-- Path avatars: avatars/{auth.uid()}/{timestamp}
```

⚠️ Los slugs de category y condition son los que llegan a DB. `lib/constants/categories.ts` tiene display names — NO es la fuente de verdad del schema.

---

## Features pendientes

| Feature | Estado |
|---------|--------|
| Paginación en home | Sin implementar. Límite hardcodeado en 48 |
| Valoraciones / reviews | ✅ Implementado. Schema en `supabase/create-reviews-schema.sql`. Flujo: vendedor confirma comprador → comprador valora desde tab "Compras" → reviews visibles en perfil público |
| Ofertas de precio en chat | Schema preparado (`offer_amount` en messages), UI sin implementar |
| Pagos | Fase 2 |
| Envíos | Fase 2 |

---

## Documentación adicional

- Historial de bugs y discrepancias → `docs/bugs.md`
- Auditorías de seguridad y comportamientos especiales → `docs/security.md`