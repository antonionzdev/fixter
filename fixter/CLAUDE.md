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

| Archivo | Tipo | Función |
|---------|------|---------|
| `app/page.tsx` | Server | Home: `getLatestListings` + filtros → `RecentlyViewedSection` + `LoadMoreButton` |
| `app/layout.tsx` | Server | Root layout, metadata global |
| `app/publish/page.tsx` | Server | Protegida → `/login?redirect=/publish` si sin sesión |
| `app/dashboard/page.tsx` | Server | Protegida. Tabs activos/vendidos/compras, queries paralelas |
| `app/dashboard/ListingActions.tsx` | Client | Marcar vendido (modal), eliminar, editar anuncios propios |
| `app/dashboard/dashboard-listing-card.tsx` | Server | Card de anuncio en dashboard |
| `app/listings/[id]/page.tsx` | Server | Detalle. `cache(getListingById)` deduplica entre generateMetadata y render |
| `app/listings/[id]/edit/page.tsx` | Server | Protegida. Verifica sesión y propiedad del listing |
| `app/profile/[username]/page.tsx` | Server | Perfil público. `isOwner` + listings + reviews en Promise.all |
| `app/profile/edit/page.tsx` | Server | Protegida. Edición del propio perfil |
| `app/messages/layout.tsx` | Server | Auth check + fetch conversaciones para sidebar |
| `app/messages/page.tsx` | Server | Desktop: empty state |
| `app/messages/[conversationId]/page.tsx` | Server | Chat: mensajes iniciales, mark-as-read server-side |
| `app/(auth)/login/page.tsx` | — | LoginForm, acepta `?redirect=` |
| `app/(auth)/register/page.tsx` | — | RegisterForm |

### `components/`

| Archivo | Tipo | Función |
|---------|------|---------|
| `components/layout/site-header.tsx` | Server | Header sticky |
| `components/layout/site-header-nav.tsx` | Client | Nav con auth dinámica. useEffect + getSession() |
| `components/layout/site-header-search.tsx` | Client | Input search → router.push con `?search=` |
| `components/listings/product-card.tsx` | Server | Card en home, recibe `ListingWithSeller` |
| `components/listings/marketplace-listing-card.tsx` | Server | Card en perfil de vendedor |
| `components/listings/publish-form.tsx` | Client | Publicación: upload + insert inline; limpia Storage si falla |
| `components/listings/edit-listing-form.tsx` | Client | Edición con datos precargados y gestión de imágenes |
| `components/listings/search-filters.tsx` | Client | Panel filtros colapsable; importa constantes de `lib/constants/` |
| `components/listings/listing-detail-view.tsx` | Server | Layout 60/40, sidebar sticky, specs en grid, precio protagonista |
| `components/listings/listing-gallery.tsx` | Client | Galería 4:3 + thumbnails. Crossfade 200ms via `key={selectedIndex}` |
| `components/listings/contact-seller-button.tsx` | Client | Crea o navega a conversación. Oculto si es el propio vendedor |
| `components/listings/condition-badge.tsx` | Server | Badge con color por condición |
| `components/listings/load-more-button.tsx` | Client | Grid paginado cursor-based, botón "Cargar más" |
| `components/listings/recently-viewed-tracker.tsx` | Client | Sin UI. Registra IDs en localStorage (`fixter_recently_viewed`, máx 8) |
| `components/listings/recently-viewed-section.tsx` | Client | Lee localStorage → query `.in("id", ids)` → grid scroll horizontal |
| `components/listings/make-offer-button.tsx` | Client | Botón "Hacer oferta": crea/reutiliza conversación + modal de importe |
| `components/listings/accepted-offer-price.tsx` | Client | Muestra precio acordado si el usuario tiene oferta aceptada en este listing |
| `components/chat/OfferCard.tsx` | Client | Card de oferta en chat: estados pending/accepted/rejected/countered con acciones |
| `components/chat/OfferSummaryModal.tsx` | Client | Modal resumen de oferta: estado, CTA compra (placeholder hasta pagos) |
| `components/auth/login-form.tsx` | Client | signInWithPassword() → ensureUserProfile() |
| `components/auth/register-form.tsx` | Client | signUp() |
| `components/profile/profile-page-client.tsx` | Client | Vista/edición inline de perfil. Grid 2/3/4. `isOwner` controla controles |
| `components/profile/profile-edit-form.tsx` | Client | Edición de perfil; avatar upload al bucket `avatars` |
| `components/profile/star-rating.tsx` | Client | 5 estrellas SVG. Props: rating, count, size (`sm`\|`md`) |
| `components/profile/reviews-list.tsx` | Server | Banner avg (`text-5xl font-black` + StarRating) + lista de cards |
| `components/dashboard/mark-as-sold-modal.tsx` | Client | Confirma venta: carga compradores de conversations, selecciona `confirmed_buyer_id` |
| `components/dashboard/purchase-card.tsx` | Client | Card compra en tab "Compras". Abre ReviewFormModal |
| `components/dashboard/review-form-modal.tsx` | Client | Formulario valoración: 5 estrellas + textarea. INSERT en reviews |
| `components/messages/messages-shell.tsx` | Client | Layout dos columnas. usePathname() decide vista móvil/desktop |
| `components/messages/chat-view.tsx` | Client | Chat Realtime. initialMessages → useState + suscripción postgres_changes |

⚠️ Dead code (no importados): `components/listings/image-upload-field.tsx`, `lib/listings.ts`, `components/profile/profile-header.tsx`

### `hooks/`

| Archivo | Exporta |
|---------|---------|
| `hooks/useOffers.ts` | `useOffers()` — sendOffer, acceptOffer, rejectOffer, counterOffer, getDailyUsed |
| `hooks/useUnreadCount.ts` | `useUnreadCount()` — contador de mensajes no leídos con suscripción Realtime |

### `lib/`

| Archivo | Exporta |
|---------|---------|
| `lib/listings-queries.ts` | `getLatestListings(limit, filters, cursor?)` → `{ listings, nextCursor }`, `getListingById()`, `applyFilters()` |
| `lib/profiles.ts` | `ensureUserProfile()`, `ensureUserProfileById()` |
| `lib/profile-queries.ts` | `getProfileByUsername()`, `getActiveListingsBySellerId()`, `getReviewsByProfileId()` |
| `lib/profile-utils.ts` | `getSellerDisplayName()`, `normalizeProfile()` |
| `lib/format.ts` | `formatPrice()`, `formatRelativeTime()`, `formatMemberSince()` — locale es-ES |
| `lib/auth-errors.ts` | `getAuthErrorMessage()` — errores Supabase Auth en español |
| `lib/constants/categories.ts` | `LISTING_CATEGORIES`, `LISTING_CONDITIONS`, `LISTING_IMAGES_BUCKET`, `MAX_LISTING_IMAGES=8` |
| `lib/types/listing.ts` | `ListingRow`, `ListingWithSeller`, `ListingDetailWithSeller`, `ListingFilters`, `PublishListingInput` |
| `lib/types/profile.ts` | `PublicProfile`, `ReviewSummary` |
| `lib/types/messaging.ts` | `ConversationRow`, `MessageRow`, `ConversationWithDetails`, `MessageInsert`, `OfferRow` |
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

public.offers
  id UUID PK | conversation_id UUID FK conversations.id | listing_id UUID FK listings.id
  buyer_id UUID FK profiles.id | seller_id UUID FK profiles.id
  amount DECIMAL(10,2) CHECK(>0) | status TEXT ('pending'|'accepted'|'rejected'|'countered')
  counter_amount DECIMAL(10,2) NULL | created_at TIMESTAMPTZ | updated_at TIMESTAMPTZ
  -- buyer_id/seller_id invierten roles en contraoferta: el seller inserta nueva oferta como buyer
  -- Trigger trg_validate_offer: max 10 por dia por buyer + 1 pending por conversacion

-- Storage buckets: listing-images / avatars
-- Path listing-images: {auth.uid()}/{batchId}/{uuid}-{filename}
-- Path avatars: avatars/{auth.uid()}/{timestamp}
```

⚠️ Los slugs de category y condition son los que llegan a DB. `lib/constants/categories.ts` tiene display names — NO es la fuente de verdad del schema.

### `supabase/`

| Archivo | Qué contiene |
|---------|--------------|
| `supabase/create-reviews-schema.sql` | ALTER TABLE listings (confirmed_buyer_id), CREATE TABLE reviews, RLS, trigger prevent_buyer_reassignment |
| `supabase/create-messaging-schema.sql` | CREATE TABLE conversations + messages, RLS, trigger last_message_at |
| `supabase/create-profile-trigger.sql` | Trigger que crea perfil automáticamente al registrar usuario en auth |
| `supabase/seed.sql` | 5 perfiles + 60 anuncios. Idempotente. Requiere `SET session_replication_role = replica` |
| `supabase/add-reviews-and-profile-fields.sql` | Campos adicionales de reviews y perfil |
| `supabase/fix-listings-update-rls.sql` | Fix de RLS para UPDATE en listings |
| `supabase/fix-rls.sql` | Correcciones de RLS generales |
| `supabase/policies-reference.sql` | Referencia de todas las policies activas |
| `supabase/update-reviews-rls-bidirectional.sql` | RLS bidireccional para reviews (revisor y revisado) |
| `supabase/create-payments-schema.sql` | orders + disputes tables, RLS, updated_at triggers, pg_cron auto-complete. También añade stripe_account_id + stripe_onboarding_complete a profiles |

---

## Sistema de Pagos (Fase 2 — implementado 2026-06-04)

### Stack de pagos
- **Stripe** `stripe@22` server-side, `@stripe/stripe-js` + `@stripe/react-stripe-js` client-side
- **capture_method: 'manual'** — el dinero queda retenido en escrow hasta confirmación del comprador
- **Stripe Connect Express** — los vendedores se onboardean para recibir pagos directos

### Variables de entorno requeridas
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_SERVICE_ROLE_KEY=...       # Solo en servidor, nunca al cliente
NEXT_PUBLIC_APP_URL=https://...     # Para redirect URLs de Connect
```

### Clientes nuevos
| Archivo | Exporta | Cuándo usarlo |
|---------|---------|---------------|
| `lib/supabase-service.ts` | `createServiceSupabase()` | API routes que necesitan bypass de RLS (service_role key) |
| `lib/stripe.ts` | `getStripe()` | Singleton del SDK server-side de Stripe |

### Schema de base de datos — nuevas tablas

```sql
public.orders
  id UUID PK | listing_id UUID FK | buyer_id UUID FK | seller_id UUID FK
  amount NUMERIC(10,2) | commission_amount NUMERIC(10,2) | shipping_amount NUMERIC(10,2) | total_amount NUMERIC(10,2)
  stripe_payment_intent_id TEXT UNIQUE | status TEXT | tracking_number TEXT NULL | carrier TEXT NULL
  delivered_at TIMESTAMPTZ NULL | created_at TIMESTAMPTZ | updated_at TIMESTAMPTZ
  -- status values: 'pending_payment','paid','shipped','delivered','completed','disputed','refunded','cancelled'

public.disputes
  id UUID PK | order_id UUID FK orders.id | buyer_id UUID FK profiles.id
  dispute_type TEXT | description TEXT | evidence_urls TEXT[] | status TEXT | resolution_notes TEXT NULL
  -- dispute_type values: 'not-received','damaged','wrong-item','incorrect','incomplete','other'
  -- status values: 'pending','under_review','resolved_buyer','resolved_seller','closed'

profiles (nuevas columnas):
  stripe_account_id TEXT NULL | stripe_onboarding_complete BOOLEAN DEFAULT FALSE
```

### Mapa de archivos — pagos

#### `app/api/stripe/`
| Route | Método | Qué hace |
|-------|--------|----------|
| `create-payment-intent/route.ts` | POST | Crea PI con capture_method manual, crea order en DB. Body: `{ listingId }`. Returns: `{ clientSecret, orderId }` |
| `capture-payment/route.ts` | POST | Captura el PI cuando el comprador confirma recepción. Body: `{ orderId }` |
| `add-tracking/route.ts` | POST | Vendedor añade tracking. Body: `{ orderId, trackingNumber, carrier }` |
| `submit-dispute/route.ts` | POST | Crea dispute + pone orden en 'disputed'. Body: `{ orderId, disputeType, description, evidenceUrls }` |
| `webhook/route.ts` | POST | Webhooks de Stripe: amount_capturable_updated → 'paid', payment_failed → 'cancelled', succeeded → 'completed' |
| `connect/onboard/route.ts` | POST | Crea Stripe Express account + link de onboarding |
| `connect/verify/route.ts` | POST | Verifica que el onboarding esté completo (details_submitted + charges_enabled) |

⚠️ Todos usan `createServiceSupabase()` para escribir en DB (bypass RLS). La auth del usuario se verifica con `createAuthServerSupabase()`.

#### Pages de pagos

| Página | Ruta | Tipo | Quién la ve |
|--------|------|------|-------------|
| Checkout | `/checkout/[listingId]` | Server + Client | Comprador |
| Pedido confirmado | `/orders/[orderId]/success` | Server | Comprador |
| Seguimiento | `/orders/[orderId]/tracking` | Server | Comprador + Vendedor |
| Confirmar recepción | `/orders/[orderId]/receive` | Server + Client | Comprador |
| Pago fallido | `/payment/failed` | Server | Comprador |
| Reclamación — tipo | `/orders/[orderId]/dispute/type` | Server + Client | Comprador |
| Reclamación — form | `/orders/[orderId]/dispute/form` | Server + Client | Comprador |
| Reclamación — enviada | `/orders/[orderId]/dispute/sent` | Server | Comprador |
| Vista vendedor | `/dashboard/sales/[orderId]` | Server + Client | Vendedor |
| Conectar cuenta | `/dashboard/connect` | Server + Client | Vendedor |
| Return onboarding | `/dashboard/connect/return` | Client | Vendedor |
| Refresh onboarding | `/dashboard/connect/refresh` | Server (redirect) | Vendedor |

#### Components de pagos

| Componente | Archivo | Tipo |
|------------|---------|------|
| Formulario checkout con Stripe Elements | `components/payments/checkout-form.tsx` | Client |
| Botón copiar tracking | `components/payments/tracking-copy-button.tsx` | Client |
| Confirmación de recepción | `components/payments/receive-confirmation.tsx` | Client |
| Selector tipo reclamación | `components/payments/dispute-type-selector.tsx` | Client |
| Formulario reclamación | `components/payments/dispute-form.tsx` | Client |
| Vista vendedor con tracking form | `components/payments/seller-order-view.tsx` | Client |

#### Lib de pagos

| Archivo | Exporta |
|---------|---------|
| `lib/types/orders.ts` | `OrderRow`, `DisputeRow`, `OrderWithDetails`, `OrderStatus`, `DisputeType`, `CARRIERS`, `DISPUTE_TYPES`, `calcOrderAmounts()` |
| `lib/orders-queries.ts` | `getOrderById()`, `getOrderByPaymentIntent()`, `getBuyerOrders()` |

### Flujo de pago (escrow)
1. Comprador en `/checkout/[listingId]` → llama `create-payment-intent` → obtiene `clientSecret + orderId`
2. Stripe.js confirma el pago → PI pasa a `requires_capture` → webhook actualiza order a `paid`
3. Vendedor en `/dashboard/sales/[orderId]` → añade tracking → order a `shipped`
4. Comprador en `/orders/[orderId]/receive` → confirma recepción → `capture-payment` → PI capturado → order a `completed`
5. **Auto-liberación a 48h**: pg_cron `auto_complete_delivered_orders()` (requiere activar pg_cron en Supabase Dashboard) + captura manual desde webhook

### Stripe Connect
- Comisión: `commission_amount = amount × 0.08` (8%)
- Si el vendedor tiene `stripe_account_id` + `stripe_onboarding_complete = true`: PI incluye `application_fee_amount + transfer_data.destination`
- Si no: PI se carga a la plataforma (pago manual al vendedor hasta que se onboardee)
- Onboarding: `/dashboard/connect` → `/api/stripe/connect/onboard` → Stripe Express → `/dashboard/connect/return`

### Webhooks a configurar en Stripe Dashboard
```
payment_intent.amount_capturable_updated  → order status: pending_payment → paid
payment_intent.payment_failed             → order status: pending_payment → cancelled
payment_intent.succeeded                  → order status: shipped/delivered → completed
charge.refunded                           → order status: → refunded
```
Endpoint: `https://tu-dominio.com/api/stripe/webhook`

---

MVP completo (paginación, reviews, vistos recientemente, ofertas, **pagos**). Fase 3: Notificaciones push, Stripe payouts automáticos, tracking en tiempo real.

---

## Sistema de diseño visual

Convenciones establecidas en sesión 02/06/2026. Aplican a todos los componentes nuevos o rediseñados.

### Tokens y paleta
- **Acento de marca**: `#FF6B2B` (naranja) — definido como `--color-brand-orange` en `globals.css`
- **Negro primario**: `bg-zinc-950` / `text-zinc-950` (más profundo que zinc-900)
- **Fondo de specs / metadatos**: `bg-[#F9FAFB]` o `bg-zinc-50`
- **Fondo de página de perfil**: `bg-zinc-50`
- **Easing estándar**: `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)` (definido en globals.css)

### Avatar fallback
Cuando un usuario no tiene `avatar_url`, el fallback es la **inicial del username sobre fondo naranja**:
```
bg-[#FF6B2B] text-white font-bold
```
No usar `bg-zinc-100 text-zinc-500` en componentes nuevos.

### Botones primarios
```
bg-zinc-950 py-4 text-base font-semibold text-white rounded-xl w-full
transition-[opacity,transform] duration-200 ease-out
hover:opacity-90 active:scale-[0.97]
disabled:opacity-40 disabled:cursor-not-allowed
```
- **Hover**: cambio de opacidad, nunca cambio de color de fondo.
- **Active**: `scale-[0.97]` siempre en botones accionables (feedback táctil).
- Skeleton de carga del botón: `h-[56px] animate-pulse rounded-xl bg-zinc-100`.

### Botones secundarios / outline
```
rounded-lg border border-zinc-200 px-3.5 py-1.5
text-sm font-medium text-zinc-500
hover:bg-zinc-50 hover:text-zinc-700
transition-colors duration-150
```

### Transiciones
- Especificar siempre propiedades exactas: `transition-[opacity,transform]` en lugar de `transition-all`.
- Duración estándar: `duration-200 ease-out`.
- Galería — crossfade al cambiar imagen: `@keyframes gallery-fade-in` en `globals.css`, aplicado con `animate-[gallery-fade-in_200ms_ease-out_both]` + `key={selectedIndex}` en el wrapper de la imagen.

### Grid de anuncios (canónico)
El grid estándar para listados es **4-3-2** columnas según breakpoint:
```
grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5
```
Usar este grid en perfil, búsqueda, y cualquier colección nueva. El home usa `LoadMoreButton` que tiene su propio grid interno — pendiente de alinear.

### Layout de detalle de anuncio
- Dos columnas: `grid-cols-[3fr_2fr]` (60% / 40%). En móvil: columna única.
- Sidebar derecho: `lg:sticky lg:top-8 lg:self-start lg:row-span-2`.
- Precio: protagonista visual — `text-5xl font-black tracking-tight text-zinc-950`.
- Sección de specs: `dl` con `grid grid-cols-[auto_1fr]` sobre `bg-[#F9FAFB] rounded-xl px-4 py-4`. Sin bordes de tabla.
- Descripción: texto limpio sin caja, `leading-[1.8]`.
- Separador antes de info vendedor: `<hr className="border-zinc-100">`.

### Perfil público
- Avatar: `h-24 w-24 sm:h-28 sm:w-28` con `ring-2 ring-zinc-200`.
- Username: `text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl`.
- Fila de metadatos (ubicación + fecha + anuncios): iconos SVG inline `h-3.5 w-3.5`, `gap-x-4`, sin bullets ni guiones.
- Rating: línea propia debajo de los metadatos.
- Botón "Editar perfil": outline discreto, `text-zinc-500`, sin sombra.
- Estado vacío (owner sin anuncios): dashed box + botón naranja `bg-[#FF6B2B]` → `/publish`.

### Resumen de valoraciones
El componente `ReviewsList` computa el promedio directamente desde el array de items (`reduce`) y muestra un banner `bg-zinc-50 rounded-xl` con puntuación grande (`text-5xl font-black`) + `StarRating` + conteo, encima de la lista de cards.

### Reglas de animación (Emil Kowalski)
- Solo animar `transform` y `opacity`. Nunca `width`, `height`, `padding`.
- Duraciones: micro-interacciones 150-200ms, transiciones de imagen 200ms. Nunca más de 300ms para UI frecuente.
- `ease-out` para entradas. `ease-in-out` para movimiento en pantalla.
- No animar acciones de teclado (alta frecuencia → sin animación).
- `@starting-style` o `key` prop para fade-in de elementos que se remontan.

---

## Pendiente

- **Home grid**: `LoadMoreButton` usa `xl:grid-cols-4` — alinear con canónico `lg:grid-cols-4`
- **Dashboard**: Rediseño visual (cards de anuncios propios, tabs activos/vendidos/compras)
- **Mensajes**: Rediseño visual de `MessagesShell` y `ChatView`
- **Filtros móvil**: `SearchFilters` en drawer — revisar UX
- **`profile-edit-form.tsx`**: Evaluar duplicidad con edición inline de `ProfilePageClient`
- **`listing-gallery.tsx`**: Thumbnails móvil — evaluar flechas prev/next

---

## Documentación adicional

- Historial de bugs y discrepancias → `docs/bugs.md`
- Auditorías de seguridad y comportamientos especiales → `docs/security.md`
- Skills de diseño: `.claude/skills/emil-design-eng/SKILL.md`, `.claude/skills/design-taste-frontend/SKILL.md`
