# Fixter — Auditorías de seguridad

---

## Auditoría 1: Sistema de valoraciones (reviews)

**Fecha:** 2026-06-02
**Sesión auditada:** Implementación de `public.reviews` + `confirmed_buyer_id` en `public.listings`, RLS policies, trigger de protección y flujo UI (mark-as-sold modal, purchase-card, review-form-modal).

### CRÍTICO — Sin problemas encontrados

El flujo de valoraciones no presenta vulnerabilidades críticas. La RLS de `INSERT` en `reviews` verifica en base de datos (no en cliente) que el insertador es el comprador confirmado y que el `reviewed_id` declarado coincide con el `seller_id` real del listing.

### MEDIO — Corregidos antes de entregar

#### M-2 · Reasignación de `confirmed_buyer_id` tras review existente

**Problema:** El vendedor podía cambiar `confirmed_buyer_id` a un segundo comprador después de que el primero ya hubiera dejado una valoración, acumulando reviews extra manipulando el campo.

**Fix aplicado:** Trigger `prevent_buyer_reassignment_trigger` (BEFORE UPDATE ON listings, SECURITY DEFINER). Lanza excepción si `confirmed_buyer_id` cambia y ya existe una fila en `reviews` para ese `listing_id`.

**Archivo:** `supabase/create-reviews-schema.sql` — función `prevent_buyer_reassignment()`.

#### M-3 · `confirmed_buyer_id` podía setearse sin `status = 'sold'`

**Problema:** La RLS de UPDATE original solo verificaba `auth.uid() = seller_id`, sin exigir que el anuncio estuviera vendido al asignar el comprador. Un vendedor podía marcar un comprador en un anuncio aún activo.

**Fix aplicado:** CHECK constraint `listings_sold_if_buyer_set`: `CHECK (confirmed_buyer_id IS NULL OR status = 'sold')`. La RLS de UPDATE también fue reemplazada para incluir esa condición en `WITH CHECK`.

**Archivo:** `supabase/create-reviews-schema.sql` — secciones 1 y 2.

### BAJO — Corregidos

#### B-3 · `reviewed_id` declarado por el cliente podría no coincidir con el vendedor real

**Problema:** El INSERT de una review incluye `reviewed_id` como campo enviado por el cliente. Sin validación server-side, un atacante podría enviar un `reviewed_id` arbitrario y asignarle una valoración negativa a un tercero.

**Fix aplicado:** La RLS policy `"Confirmed buyer can insert review"` verifica en la subconsulta que `l.seller_id = reviewed_id`. Aunque el cliente envíe cualquier `reviewed_id`, Supabase lo rechaza si no coincide con el vendedor real del listing.

**Archivo:** `supabase/create-reviews-schema.sql` — sección 5.

### Restricciones de integridad adicionales verificadas

| Código | Restricción | Dónde |
|--------|-------------|-------|
| C-1 | Buyer ≠ seller en listings: `CHECK (confirmed_buyer_id IS NULL OR confirmed_buyer_id <> seller_id)` | listings — sección 1 |
| C-2 | `reviewed_id` debe coincidir con `seller_id` real del listing — verificado en RLS INSERT | reviews — sección 5 |
| C-3 | Auto-valoración imposible: `CHECK (reviewer_id <> reviewed_id)` | reviews — sección 3 |
| C-4 | Una sola review por transacción: `UNIQUE (listing_id, reviewer_id)` | reviews — sección 3 |
| C-5 | Rating en rango: `CHECK (rating >= 1 AND rating <= 5)` | reviews — sección 3 |
| C-6 | Comentario máx 1000 chars: `CHECK (comment IS NULL OR length(comment) <= 1000)` | reviews — sección 3 |

### Sin problemas encontrados en

- **RLS SELECT en `reviews`:** acceso público correcto — el perfil del vendedor es visible para todos.
- **RLS UPDATE/DELETE en `reviews`:** no se definen policies → RLS deniega por defecto. Las valoraciones son permanentes e inmutables.
- **Permisos de rol:** `anon` y `authenticated` solo tienen `SELECT`; `authenticated` tiene `INSERT`. No se concede `UPDATE` ni `DELETE`.
- **Índices:** cubren los accesos frecuentes (`reviewed_id`, `listing_id`, `reviewer_id`).
- **Trigger SECURITY DEFINER:** `prevent_buyer_reassignment` define `search_path = public` para evitar ataques de search_path injection.

---

## Auditoría 2: MVP completo — primera ronda

**Fecha:** 2026-06-03
**Sesión auditada:** Sistema de ofertas (offers), reviews (RLS en producción), mensajería (Realtime), y precio de oferta aceptada.

**Nota:** esta auditoría reveló discrepancias entre los archivos SQL del repositorio y el estado real de la base de datos. Los hallazgos se basan en inspección directa de la DB vía MCP.

### CRÍTICO — Corregido

#### C-R1 · Policy `"Authenticated insert review"` con OR semántica anulaba la policy restrictiva

**Problema:** Dos policies INSERT coexistían en `public.reviews`. La OR semántica de Supabase hace que baste con que UNA pase. `"Authenticated insert review"` solo verificaba `auth.uid() = reviewer_id`, permitiendo a cualquier usuario autenticado valorar a cualquier persona sin ser parte de ninguna transacción.

**Fix aplicado** (`fix_reviews_rls`):
- Eliminadas: `"Authenticated insert review"`, `"Confirmed buyer can insert review"`, `"Owners update review"`, `"Owners delete review"`.
- `REVOKE UPDATE, DELETE` del rol `authenticated`.
- Creada `"Transaction participants can insert review"`: bidireccional, exige `l.status = 'sold'` y `l.confirmed_buyer_id IS NOT NULL`.

**Archivo:** `supabase/security-fixes-2026-06-03.sql`

### MEDIO — Corregido

#### M-O1 · Policy INSERT de `offers` sin verificación de pertenencia a la conversación

**Problema:** La policy solo verificaba `auth.uid() = buyer_id`. Un usuario podía insertar una oferta en cualquier conversación donde él no era participante, poniendo su propio ID como `buyer_id`.

**Fix aplicado** (`fix_offers_insert_rls`): la policy INSERT ahora exige `EXISTS(conversación donde buyer_id = uid)`.

**Archivo:** `supabase/security-fixes-2026-06-03.sql`

### BAJO — Corregido

#### B-O1 · `acceptOffer`, `rejectOffer`, `counterOffer` sin verificación de sesión ni propiedad en cliente

**Fix aplicado** (`hooks/useOffers.ts`): añadidas llamadas a `getSession()` y `.eq("seller_id", session.user.id)` en los tres métodos. `counterOffer` verifica además `session.user.id === originalOffer.seller_id` y `counterAmount > 0`.

#### B-M1 · Realtime en `useUnreadCount` disparaba re-fetch en mensajes propios

**Fix aplicado** (`hooks/useUnreadCount.ts`): añadido `filter: sender_id=neq.{userId}` a las suscripciones INSERT y UPDATE de `postgres_changes`.

### Sin problemas encontrados en

- `offers` RLS en producción: SELECT, UPDATE y trigger `trg_validate_offer` (SECURITY DEFINER, 10/día, 1 pending/conv) ya existían y eran correctos.
- `conversations` y `messages` RLS: correctos y completos.

---

## Auditoría 3: MVP completo — segunda ronda

**Fecha:** 2026-06-03
**Sesión auditada:** Listados, conversaciones, mensajes, ofertas, dashboard, publicación, detalle de anuncio, y formularios de upload. Revisión exhaustiva con acceso a DB real.

### CRÍTICO — Corregido

#### C-1 · Policy UPDATE duplicada débil en `listings` anulaba la restrictiva (OR semántica)

**Problema:** Coexistían `"Owners update own listings"` (con restricción sobre `confirmed_buyer_id`) y `"Vendedor puede editar su anuncio"` (sin ninguna restricción adicional). OR semántica → la débil siempre pasaba. Un vendedor podía asignarse como `confirmed_buyer_id` de su propio anuncio.

**Fix aplicado** (`fix_listings_policies`): eliminada `"Vendedor puede editar su anuncio"`. Solo permanece `"Owners update own listings"` con `WITH CHECK: seller_id=uid AND (confirmed_buyer_id IS NULL OR status='sold')`.

Aprovechando la misma migración, se eliminaron también los duplicados inofensivos: `"Authenticated insert own listings"` (INSERT) y `"Owners delete own listings"` (DELETE).

#### C-2 · Policy SELECT `"Public read listings"` con `qual: true` exponía `confirmed_buyer_id` a usuarios anónimos

**Problema:** Cualquier petición anónima podía hacer `SELECT confirmed_buyer_id FROM listings WHERE status = 'sold'` y obtener la lista completa de compradores de la plataforma.

**Fix aplicado** (`fix_listings_policies`): eliminada `"Public read listings"`. Añadidas dos policies restrictivas:
- `"listings_select_seller"` → `auth.uid() = seller_id`
- `"listings_select_confirmed_buyer"` → `auth.uid() = confirmed_buyer_id`

Los listings activos siguen siendo públicos vía `"Anuncios activos son públicos"` (sin cambios).

#### C-3 · Policy INSERT de `conversations` no validaba que `seller_id` fuese el vendedor real del listing

**Problema:** Un atacante podía crear conversaciones con cualquier `seller_id` arbitrario. Esas conversaciones aparecerían en la bandeja de mensajes de la víctima (RLS SELECT incluye `seller_id`).

**Fix aplicado** (`fix_conversations_insert`): nueva policy con `auth.uid() <> seller_id AND EXISTS(listing donde seller_id coincide AND status='active')`.

### MEDIO — Corregido

#### M-1 · Policy UPDATE de `messages` tenía `WITH CHECK (true)`

**Problema:** El USING limitaba quién podía actualizar, pero `WITH CHECK (true)` no restringía qué campos. Un participante podía modificar `body` o `sender_id` de mensajes ajenos vía SDK.

**Fix aplicado** (`fix_messages_update_with_check`): `WITH CHECK (read_at IS NOT NULL)` — solo permite marcar mensajes como leídos.

#### M-2 · Policy INSERT de `offers` bloqueaba contraofertaslegítimas del vendedor

**Problema:** La policy exigía `c.buyer_id = auth.uid()`, bloqueando el flujo de contraoferta donde el vendedor original inserta una nueva oferta con roles invertidos (actuando como `buyer_id`).

**Fix aplicado** (`fix_offers_insert_counter_offer`): la policy ahora acepta `c.buyer_id = auth.uid() OR c.seller_id = auth.uid()`, cubriendo ambos flujos.

#### M-3 · Sin validación de tipo ni tamaño de archivo antes del upload a Storage

**Problema:** Los formularios de publicación y edición aceptaban cualquier tipo de archivo. Un atacante podía subir `.svg` con JavaScript embebido o archivos de varios GB.

**Fix aplicado:**
- `components/listings/publish-form.tsx` — validación antes del bucle de upload.
- `components/listings/edit-listing-form.tsx` — ídem.

Tipos permitidos: `image/jpeg`, `image/png`, `image/webp`, `image/gif`. Tamaño máximo: 10 MB por archivo.

### BAJO — Corregido

#### B-1 · Path de upload incluía el nombre original del archivo del usuario

**Fix:** `publish-form.tsx` y `edit-listing-form.tsx` — el path de upload ahora es `{uid}/{crypto.randomUUID()}` en lugar de `{uid}/{timestamp}_{nombre_original}`.

#### B-2 · `getSession()` en lugar de `getUser()` en `useOffers.ts`

**Fix:** Los 4 métodos (`sendOffer`, `acceptOffer`, `rejectOffer`, `counterOffer`) usan `getUser()`. `getUser()` valida contra el servidor; `getSession()` solo lee el JWT local sin re-validar.

#### B-3 · `accepted-offer-price.tsx` no cubría contraofertasen la query

**Fix:** La query usa `.or("buyer_id.eq.X,seller_id.eq.X")`. Cubre el caso de contraoferta aceptada donde el usuario aparece como `seller_id` en la oferta final.

#### B-4 · `mark-as-sold-modal` cargaba compradores sin filtro explícito de `seller_id`

**Fix:** `loadBuyers()` obtiene el usuario con `getUser()` y añade `.eq("seller_id", user.id)` al query de conversaciones. Defensa en profundidad sobre la RLS.

#### B-5 · `dashboard/page.tsx` usaba `SELECT *` para los listings del vendedor

**Fix:** `SELECT *` reemplazado por los 13 campos del tipo `SellerListing`. Campos internos (`confirmed_buyer_id`, `specs`, `shipping_available`, `views_count`) ya no se serializan al HTML del cliente.

#### B-6 · `ListingActions.tsx` exponía ruta interna de SQL en un `window.alert()` de producción

**Fix:** Eliminada la función `formatListingError()` que incluía `fixter/supabase/fix-listings-update-rls.sql` en el mensaje de error. Reemplazada por mensaje genérico.

#### B-7 · `conversationId` de la URL no se validaba como UUID antes de la query

**Fix:** `messages/[conversationId]/page.tsx` — validación con regex UUID antes del `SELECT`. Cualquier ID malformado devuelve 404 directamente sin llegar a la DB.

### Sin problemas encontrados en

- `/dashboard`, `/publish`, `/messages/[conversationId]`: verifican sesión con `createAuthServerSupabase()` antes de cualquier query.
- `/messages/[conversationId]`: verifica explícitamente que `buyer_id === uid || seller_id === uid` antes de renderizar.
- `mark-as-sold-modal.tsx`: `handleConfirm` verifica sesión con `getUser()` y usa `.eq("seller_id", user.id)` en el UPDATE.
- `edit-listing-form.tsx`: el UPDATE incluye `.eq("seller_id", user.id)`.
- `ListingActions.tsx` (delete): verifica sesión con `getUser()`, DELETE incluye `.eq("seller_id", user.id)`.
- `contact-seller-button.tsx`: previene conversaciones consigo mismo con guardia cliente + constraint DB.
- `messages-shell.tsx`: solo presentación, sin queries propias.
- `useUnreadCount.ts`: suscripciones Realtime filtradas. No expone mensajes de otras conversaciones.
- `messaging.ts` (tipos): no expone campos de auth ni tokens.
- `profiles` RLS: SELECT público (correcto para marketplace), UPDATE solo al propio perfil.
- `messages` INSERT: verifica participación en conversación y `sender_id = auth.uid()`.
- RLS activado en todas las tablas de `public`. Verificado en DB real.

---

## Estado final de RLS en producción (2026-06-03)

### `public.reviews`
| Operación | Policy | Condición |
|-----------|--------|-----------|
| SELECT | `"Public read reviews"` | `true` (público) |
| INSERT | `"Transaction participants can insert review"` | reviewer=uid, buyer↔seller verificado, listing sold |
| UPDATE | — | bloqueado por defecto |
| DELETE | — | bloqueado por defecto |

### `public.listings`
| Operación | Policy | Condición |
|-----------|--------|-----------|
| SELECT | `"Anuncios activos son públicos"` | `status = 'active'` |
| SELECT | `"listings_select_seller"` | `auth.uid() = seller_id` |
| SELECT | `"listings_select_confirmed_buyer"` | `auth.uid() = confirmed_buyer_id` |
| INSERT | `"Usuarios autenticados pueden publicar"` | `auth.uid() = seller_id` |
| UPDATE | `"Owners update own listings"` | seller=uid AND (confirmed_buyer_id IS NULL OR status='sold') |
| DELETE | `"Vendedor puede eliminar su anuncio"` | `auth.uid() = seller_id` |

### `public.conversations`
| Operación | Policy | Condición |
|-----------|--------|-----------|
| SELECT | `"conversations_select_participants"` | `buyer_id=uid OR seller_id=uid` |
| INSERT | `"conversations_insert"` | buyer_id=uid AND uid≠seller_id AND EXISTS(listing válido) |

### `public.messages`
| Operación | Policy | Condición |
|-----------|--------|-----------|
| SELECT | `"messages_select_participants"` | EXISTS(conv participante) |
| INSERT | `"messages_insert_participants"` | sender_id=uid AND EXISTS(conv participante) |
| UPDATE | `"messages_update_read_at"` | USING: uid≠sender AND participante; WITH CHECK: read_at IS NOT NULL |

### `public.offers`
| Operación | Policy | Condición |
|-----------|--------|-----------|
| SELECT | `"offers_select"` | `buyer_id=uid OR seller_id=uid` |
| INSERT | `"offers_insert"` | buyer_id=uid AND (conv.buyer_id=uid OR conv.seller_id=uid) |
| UPDATE | `"offers_update"` | `auth.uid() = seller_id` |

---
---

# AUDITORÍA 4 — AUDITORÍA DE SEGURIDAD EXTREMA PRE-LANZAMIENTO (STRIPE)

**Fecha:** 2026-06-04
**Alcance:** Sistema de pagos completo (Stripe Connect + escrow), órdenes, disputas, RLS de todas las tablas, autenticación, autorización (IDOR/BOLA), lógica de negocio, almacenamiento, privacidad/PII, OWASP Top 10, concurrencia y forensia.
**Modalidad:** Auditoría adversarial. Se asumió que el sistema era inseguro y se intentó activamente romper cada flujo financiero.
**Metodología:** Lectura directa del código fuente (no inferencia). Cada hallazgo cita archivo y función. Se mapearon todas las rutas de escritura financiera, los tres clientes de Supabase, los privilegios de rol y los flujos de estado de las órdenes.

> ⚠️ Esta auditoría **invalida** la conclusión de la Auditoría 3 que marcaba `profiles` como "SELECT público (correcto para marketplace)". A nivel de **columna**, ese SELECT público filtraba PII (teléfono) y datos de pago (`stripe_account_id`) de todos los usuarios. Ver **F-03**.

---

## 1. RESUMEN EJECUTIVO

Se auditó el sistema de pagos recién incorporado (Fase 2). La arquitectura base es **sólida en varios aspectos clave**: los importes se calculan **siempre en el servidor** (`calcOrderAmounts` sobre `listing.price`, nunca desde el cliente), la firma de los webhooks se verifica criptográficamente, las escrituras críticas a `orders`/`disputes` van por `service_role` con RLS que bloquea a los clientes, y las páginas de pedido verifican propiedad (`buyer_id`/`seller_id`) además de la RLS.

Sin embargo, se encontraron **2 vulnerabilidades CRÍTICAS (P0)** y **4 ALTAS (P1)** que **bloqueaban el lanzamiento**:

- **F-01 (P0):** No existía exclusividad de compra → **dos compradores podían pagar el mismo artículo** (doble venta) + race condition.
- **F-02 (P0):** Un usuario podía **auto-modificar sus columnas Stripe** (`stripe_account_id`, `stripe_onboarding_complete`) desde el navegador.
- **F-03 (P1):** **Exposición masiva de PII** — teléfono y `stripe_account_id` de **todos** los usuarios eran legibles por cualquiera (incluso anónimo).
- **F-04 (P1):** Webhook **sin idempotencia ni auditoría** + `charge.refunded` sin guarda + sin manejar expiración del PI.
- **F-05 (P1):** El **escrow nunca se liberaba automáticamente**; el PaymentIntent de captura manual **expira a los 7 días** → el vendedor podía no cobrar nunca.
- **F-06 (P1):** `listings.price` **sin CHECK > 0**.

**Todos los hallazgos P0 y P1 han sido corregidos en esta sesión** (código + migración SQL). Quedan tareas **operativas** obligatorias antes del lanzamiento (aplicar la migración, configurar el bucket de Storage, programar el cron de auto-captura, rate limiting). Ver checklist (§8) y veredicto (§9).

---

## 2. HALLAZGOS CRÍTICOS (P0) — CORREGIDOS

### F-01 · Doble venta y race condition en la creación de órdenes
- **Severidad:** CRÍTICA · **Prioridad:** P0
- **Descripción:** `create-payment-intent` solo comprobaba órdenes activas del **mismo** comprador (`.eq('buyer_id', user.id)`). No reservaba el anuncio ni lo marcaba vendido, y no existía constraint de unicidad en `orders` por `listing_id`. El listing permanece `active` tras una compra.
- **Impacto:** **Robo de dinero / fraude financiero.** Dos (o N) compradores distintos podían crear PaymentIntents y pagar el **mismo artículo físico**. El vendedor solo puede enviar a uno; la plataforma queda obligada a reembolsar al resto → chargebacks, pérdida de comisión, daño reputacional. Adicionalmente, dos peticiones concurrentes del mismo comprador (TOCTOU) creaban dos órdenes/PIs.
- **Escenario de explotación:**
  1. Atacante y víctima abren `/checkout/{listingId}` del mismo anuncio.
  2. Ambos clientes llaman a `create-payment-intent`; ambos pasan la comprobación (que solo mira el propio buyer).
  3. Ambos confirman el pago → dos PIs en `requires_capture` → dos órdenes `paid`.
  4. Ambos compradores "compraron" el mismo móvil.
- **Evidencia:** `app/api/stripe/create-payment-intent/route.ts` (comprobación de orden previa filtrada por `buyer_id`); `supabase/create-payments-schema.sql:14-36` (sin índice único por `listing_id`).
- **Corrección aplicada:**
  - **DB (fuente de verdad):** índice único parcial `orders_one_active_per_listing ON orders(listing_id) WHERE status IN (...estados vivos...)` → solo una orden viva por anuncio. (`supabase/security-fixes-2026-06-04.sql`)
  - **Ruta:** ahora comprueba órdenes vivas de **cualquier** comprador (resume si es propio, bloquea 409 si es ajeno) y, ante violación de unicidad concurrente (`23505`), **cancela el PaymentIntent** sobrante y devuelve 409. (`app/api/stripe/create-payment-intent/route.ts`)

### F-02 · Columnas Stripe de `profiles` escribibles desde el cliente
- **Severidad:** CRÍTICA · **Prioridad:** P0
- **Descripción:** La policy `"Users update own profile"` (`USING/WITH CHECK auth.uid() = id`) no restringía **columnas**, y `authenticated` tenía `GRANT UPDATE` sobre toda la tabla. Un usuario podía hacer desde el navegador:
  `supabase.from('profiles').update({ stripe_account_id, stripe_onboarding_complete: true }).eq('id', miId)`.
- **Impacto:** **Manipulación del flujo de pagos / fallo de integridad.** Un vendedor podía marcarse `stripe_onboarding_complete = true` sin onboarding real, o apuntar `stripe_account_id` a una cuenta arbitraria. En `create-payment-intent`, esto controla si se añade `transfer_data.destination` + `application_fee_amount`. Desincroniza el estado de cobro respecto a Stripe (PIs que fallan al crearse, transferencias mal dirigidas, fondos atascados). Cualquier columna sensible futura (saldo, rol) heredaría el agujero.
- **Escenario de explotación:** vendedor abre la consola → escribe `stripe_onboarding_complete=true` en su perfil → sus compras intentan transferir a una cuenta no habilitada → PI falla / fondos en limbo.
- **Evidencia:** `supabase/fix-rls.sql:80-85` (UPDATE sin restricción de columna) + `GRANT INSERT, UPDATE, DELETE ON public.listings`/profiles a `authenticated`.
- **Corrección aplicada:** privilegios a nivel de columna — `REVOKE UPDATE ON profiles FROM authenticated; GRANT UPDATE (username, full_name, avatar_url, bio, location, phone) TO authenticated`. Las columnas `stripe_*` solo las escribe `service_role` (rutas Connect). (`supabase/security-fixes-2026-06-04.sql`)

---

## 3. HALLAZGOS ALTOS (P1) — CORREGIDOS

### F-03 · Exposición masiva de PII (teléfono + `stripe_account_id`)
- **Severidad:** ALTA · **Prioridad:** P1
- **Descripción:** `"Public read profiles" USING (true)` + `GRANT SELECT` sobre **todas** las columnas permitía a cualquier usuario (incluso anónimo) leer el **teléfono** y el **`stripe_account_id`** de **todos** los usuarios. La query pública `getProfileByUsername` además hacía `select("*")`.
- **Impacto:** **Brecha de privacidad / cumplimiento (RGPD).** Recolección masiva de números de teléfono de toda la base de usuarios con una sola query:
  `getSupabase().from('profiles').select('phone, stripe_account_id')`. Exposición de identificadores de cuentas Connect.
- **Escenario de explotación:** atacante anónimo abre la consola del navegador y descarga el directorio completo de teléfonos.
- **Evidencia:** `supabase/fix-rls.sql:68-72`; `lib/profile-queries.ts:43-47` (`select("*")`); `lib/orders-queries.ts:8-9` (join exponía `stripe_account_id`).
- **Corrección aplicada:**
  - **DB:** `REVOKE SELECT ON profiles FROM anon, authenticated; GRANT SELECT (id, username, full_name, avatar_url, bio, location, created_at)`. (`security-fixes-2026-06-04.sql`)
  - **Código:** `getProfileByUsername` selecciona solo columnas públicas y nunca devuelve `phone`; `ORDER_SELECT` deja de pedir `stripe_*`; los joins `profiles!seller_id(*)` (home, load-more, recently-viewed) pasan a columnas explícitas; la lectura del **propio** teléfono (`/profile/edit`) y de los **propios** campos Stripe (`/dashboard/connect`) se hace vía `service_role` acotado a `user.id`.

### F-04 · Webhook sin idempotencia, sin auditoría, refund sin guarda
- **Severidad:** ALTA · **Prioridad:** P1
- **Descripción:** El webhook no registraba eventos procesados (sin idempotencia ni traza forense). `charge.refunded` actualizaba a `refunded` **sin guarda de estado**, y no se manejaba `payment_intent.canceled` (expiración de la autorización).
- **Impacto:** Reprocesado ante replays/reintentos de Stripe; **ausencia total de log financiero** (requisito forense); posibilidad de degradar estados de forma inconsistente.
- **Evidencia:** `app/api/stripe/webhook/route.ts` (versión previa: switch sin tabla de eventos; `charge.refunded` sin `.in('status', ...)`).
- **Corrección aplicada:** tabla `stripe_events` (PK = `event.id`, RLS solo `service_role`) como clave de idempotencia + auditoría; patrón **procesar-luego-registrar** (handlers idempotentes, no se pierden eventos ante fallo transitorio); guarda de estado en `charge.refunded`; nuevo handler `payment_intent.canceled → cancelled`. (`security-fixes-2026-06-04.sql` + `webhook/route.ts`)

### F-05 · El escrow nunca se libera automáticamente (PI de captura manual expira a 7 días)
- **Severidad:** ALTA · **Prioridad:** P1
- **Descripción:** Con `capture_method: 'manual'`, Stripe **cancela** el PaymentIntent a los ~7 días si no se captura. La única captura era la confirmación manual del comprador (`capture-payment`). La función `auto_complete_delivered_orders()` solo cambiaba el `status` en DB a `completed` **sin capturar** en Stripe, y dependía de `delivered_at`, que **ningún flujo rellenaba**.
- **Impacto:** **Riesgo financiero directo:** si el comprador no confirma, **el vendedor nunca cobra** y la autorización expira. La "auto-liberación a 48h" documentada no existía de hecho.
- **Evidencia:** `supabase/create-payments-schema.sql:128-141` (función que no captura); `app/api/stripe/webhook/route.ts` (`succeeded` solo ocurre *después* de capturar); ningún flujo escribe `status='delivered'`/`delivered_at`.
- **Corrección aplicada:** nueva ruta `POST /api/stripe/auto-capture` (protegida por `CRON_SECRET`) que **captura realmente** en Stripe los pedidos entregados (+48h) o enviados (+6 días, margen frente al límite de 7 días) y los promueve a `completed` con guarda de estado. Función SQL reescrita (`mark_shipped_as_delivered`, no mueve dinero). **Requiere** programar un scheduler externo y definir `CRON_SECRET`. (`app/api/stripe/auto-capture/route.ts` + `security-fixes-2026-06-04.sql`)

### F-06 · `listings.price` sin restricción de positividad
- **Severidad:** ALTA · **Prioridad:** P1
- **Descripción:** No existía `CHECK` sobre `listings.price`. Vía SDK del navegador se podía insertar un anuncio con precio 0/negativo (la RLS de INSERT solo valida `seller_id`).
- **Impacto:** Integridad financiera; anuncios con precio inválido. (Mitigado parcialmente aguas abajo por `orders.amount > 0`, pero el dato sucio entra igualmente.)
- **Evidencia:** ausencia de CHECK en el esquema de `listings`; `components/listings/publish-form.tsx:199` (validación solo en cliente).
- **Corrección aplicada:** `ALTER TABLE listings ADD CONSTRAINT listings_price_positive CHECK (price > 0) NOT VALID`. (`security-fixes-2026-06-04.sql`)

---

## 4. HALLAZGOS MEDIOS (P2) — DOCUMENTADOS (pendientes pre-lanzamiento)

### F-07 · Sin rate limiting en endpoints sensibles
- **Severidad:** MEDIA · **Prioridad:** P2
- **Descripción/Impacto:** `create-payment-intent`, `connect/onboard`, `submit-dispute` y los flujos de auth no tienen límite de tasa. Un usuario autenticado puede crear muchos PaymentIntents/cuentas Connect en bucle (abuso de cuota Stripe, ruido, coste). 
- **Evidencia:** rutas en `app/api/stripe/*` sin middleware de rate limit.
- **Corrección recomendada:** rate limiting por usuario/IP (Upstash Ratelimit, Vercel, o tabla+ventana en Postgres) en las rutas de escritura y en auth.

### F-08 · Storage sin validación de MIME/tamaño en servidor; bucket público
- **Severidad:** MEDIA · **Prioridad:** P2
- **Descripción/Impacto:** La validación de tipo/tamaño es **solo en cliente** (`publish-form.tsx`). Vía SDK, un usuario puede subir a su carpeta `{uid}/...` cualquier archivo (p. ej. SVG con script). El bucket `listing-images` es de lectura pública. Un SVG servido directamente ejecutaría script en el dominio de Storage (no en el de la app, pero sigue siendo indeseable).
- **Evidencia:** `supabase/fix-rls.sql:104-111` (policy INSERT sin restricción de MIME/tamaño); `components/listings/publish-form.tsx:219-232` (validación cliente).
- **Corrección recomendada:** configurar `allowed_mime_types` (solo imágenes raster) y `file_size_limit` en el bucket desde Supabase; considerar `Content-Disposition: attachment` o servir vía transformaciones de imagen.

### F-09 · Sistema de pagos desconectado del ciclo de vida del anuncio y de reviews
- **Severidad:** MEDIA · **Prioridad:** P2
- **Descripción/Impacto:** Una orden Stripe `completed` **no** marca el `listing` como `sold` ni rellena `confirmed_buyer_id`. Consecuencias: (a) el anuncio sigue visible/comprable (agravante de F-01), (b) el comprador real **no puede dejar review** (la RLS de reviews exige `confirmed_buyer_id = uid`), que sigue atada al flujo manual "marcar como vendido".
- **Evidencia:** `webhook/route.ts` y `create-payment-intent/route.ts` nunca tocan `listings.status`; RLS de reviews en `security-fixes-2026-06-03.sql:25-43`.
- **Corrección recomendada:** al pasar la orden a `paid`/`completed`, marcar el listing `sold` y fijar `confirmed_buyer_id = buyer_id` vía `service_role`, habilitando reviews sobre transacciones reales.

### F-10 · El checkout ignora el precio de oferta aceptada
- **Severidad:** MEDIA (lógica de negocio) · **Prioridad:** P2
- **Descripción/Impacto:** `create-payment-intent` cobra siempre `listing.price`, ignorando ofertas aceptadas. El comprador que negoció un precio menor paga el precio completo.
- **Evidencia:** `app/api/stripe/create-payment-intent/route.ts` → `calcOrderAmounts(listing.price)`.
- **Corrección recomendada:** si existe una oferta `accepted` del comprador para ese listing, calcular el importe sobre el `amount` acordado (validado en servidor).

### F-11 · `capture-payment` permite liberar el escrow antes del envío
- **Severidad:** MEDIA · **Prioridad:** P2/P3
- **Descripción/Impacto:** El comprador puede capturar (liberar fondos) con la orden en `paid`, antes de que haya `tracking`/`shipped`. Es auto-perjuicio del comprador, pero rompe la garantía de "escrow hasta recepción".
- **Evidencia:** `app/api/stripe/capture-payment/route.ts:32` (`['paid','shipped','delivered']`).
- **Corrección recomendada:** permitir captura por el comprador solo desde `shipped`/`delivered`.

---

## 5. HALLAZGOS BAJOS (P3) — DOCUMENTADOS

- **F-12 · Versión de API de Stripe pinneada a `'2026-05-27.dahlia'`** (`lib/stripe.ts:9`). Verificar que es una versión válida para `stripe@^22`; si no lo es, **todas** las llamadas fallarían en runtime. Probar en modo test antes de lanzar.
- **F-13 · Colusión de reviews vía "marcar como vendido":** un vendedor puede asignar `confirmed_buyer_id` a una cuenta cómplice para auto-generar reseñas positivas. Mitiga F-09 (atar reviews a órdenes pagadas reales).
- **F-14 · Logs:** `console.error` vuelca objetos de error completos en las rutas. Asegurar que en producción no incluyan PII/secretos y enviar a un sink con control de acceso.
- **F-15 · Contraofertas (`offers`):** discrepancia documental sobre si `offers_insert` admite al vendedor (`conv.seller_id=uid`). Si el estado real es solo-buyer, el flujo de contraoferta de `useOffers.counterOffer` queda bloqueado por RLS (bug funcional, no de seguridad). Verificar en DB.

---

## 6. OWASP TOP 10 (2021) — PUNTUACIÓN

| Categoría | Estado inicial | Tras correcciones | Notas |
|-----------|----------------|-------------------|-------|
| A01 Broken Access Control | ❌ Crítico (F-01, F-02, F-03) | ✅ Correcto | RLS + grants por columna + exclusividad de compra |
| A02 Cryptographic Failures | ✅ | ✅ | Firma de webhook verificada; sin secretos en cliente |
| A03 Injection | ✅ | ✅ | Queries parametrizadas (PostgREST), sin SQL crudo, sin `dangerouslySetInnerHTML` |
| A04 Insecure Design | ❌ Alto (F-05, F-09) | ⚠️ Parcial | Escrow auto-captura añadido; falta conectar ciclo de vida (F-09) |
| A05 Security Misconfiguration | ⚠️ Medio (F-08) | ⚠️ Pendiente | Configurar bucket Storage (MIME/tamaño) |
| A06 Vulnerable Components | ✅ | ✅ | Verificar versión API Stripe (F-12) |
| A07 Auth Failures | ✅ | ✅ | `getUser()` (no `getSession`), middleware refresca sesión |
| A08 Integrity Failures | ❌ Alto (F-02, F-04, F-06) | ✅ | Idempotencia webhook + grants columna + CHECK precio |
| A09 Logging/Monitoring | ❌ (sin log financiero) | ⚠️ Parcial | `stripe_events` añade traza; falta alerting |
| A10 SSRF | ✅ | ✅ | Sin fetch a URLs controladas por usuario en servidor |

---

## 7. RESUMEN DE RIESGOS

- **Riesgo financiero:** Era **CRÍTICO** (doble venta F-01, escrow que no liberaba F-05, manipulación de cobro F-02). Tras las correcciones: **BAJO-MEDIO**, condicionado a aplicar la migración y programar la auto-captura.
- **Riesgo de seguridad:** Era **ALTO** (control de acceso roto). Tras correcciones: **BAJO**.
- **Riesgo de privacidad:** Era **ALTO** (PII masiva F-03). Tras correcciones: **BAJO**. Revisar cumplimiento RGPD (base legal del tratamiento de teléfono).
- **Riesgo de escalabilidad:** **BAJO-MEDIO**. Índices presentes; sin rate limiting (F-07) ni protección anti-abuso en endpoints de pago.
- **Riesgo de cumplimiento:** **MEDIO**. PCI: el uso de Stripe Elements mantiene los datos de tarjeta fuera del servidor (correcto). RGPD: corregida la exposición de PII; documentar retención y base legal.

---

## 8. CHECKLIST DE LANZAMIENTO

**Bloqueantes (obligatorios antes de producción):**
- [ ] **Aplicar `supabase/security-fixes-2026-06-04.sql`** en el proyecto de producción (SQL Editor). *Sin esto, F-01/F-02/F-03/F-06 siguen abiertos.*
- [ ] Verificar que el índice `orders_one_active_per_listing` existe y que un segundo checkout concurrente devuelve 409.
- [ ] Verificar que `authenticated` ya **no** puede `UPDATE` `stripe_*` ni `SELECT` `phone`/`stripe_account_id` (probar desde la consola del navegador).
- [ ] Definir `CRON_SECRET` y programar `POST /api/stripe/auto-capture` (Vercel Cron / GitHub Actions) cada hora.
- [ ] Configurar webhooks en Stripe: `payment_intent.amount_capturable_updated`, `payment_intent.payment_failed`, `payment_intent.succeeded`, `payment_intent.canceled`, `charge.refunded`.
- [ ] Confirmar `STRIPE_WEBHOOK_SECRET`, `STRIPE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`, `CRON_SECRET` en el entorno (no en el repo).
- [ ] Verificar la versión de API de Stripe (F-12) en modo test (un pago de extremo a extremo).

**Recomendados antes de usuarios reales:**
- [ ] Rate limiting en rutas de pago y auth (F-07).
- [ ] Configurar `allowed_mime_types` + `file_size_limit` en el bucket `listing-images` (F-08).
- [ ] Conectar orden pagada → `listing.sold` + `confirmed_buyer_id` y reviews (F-09).
- [ ] Cobrar el precio de oferta aceptada en checkout (F-10).
- [ ] Restringir `capture-payment` a `shipped`/`delivered` (F-11).
- [ ] Revisar logs para que no contengan PII/secretos (F-14).

---

## 9. VEREDICTO FINAL

> ### 🔴 NO APTO PARA PRODUCCIÓN — hasta aplicar la migración y los bloqueantes del checklist.
>
> Las correcciones de código de los 2 P0 y los 4 P1 **ya están implementadas en el repositorio**, pero **F-01, F-02, F-03 y F-06 dependen de aplicar `supabase/security-fixes-2026-06-04.sql` en producción**: mientras la migración no se ejecute, las vulnerabilidades críticas siguen activas en la base de datos en vivo.
>
> **Una vez aplicada la migración SQL y completados los puntos BLOQUEANTES del checklist (§8), el veredicto pasa a:**
> ### 🟡 APTO CON CORRECCIONES
> con los hallazgos P2/P3 a resolver antes de abrir a usuarios reales.

### Correcciones implementadas en esta sesión (2026-06-04)

| ID | Severidad | Archivo(s) |
|----|-----------|-----------|
| F-01 | P0 | `supabase/security-fixes-2026-06-04.sql`, `app/api/stripe/create-payment-intent/route.ts` |
| F-02 | P0 | `supabase/security-fixes-2026-06-04.sql` |
| F-03 | P1 | `supabase/security-fixes-2026-06-04.sql`, `lib/profile-queries.ts`, `lib/orders-queries.ts`, `lib/types/orders.ts`, `lib/listings-queries.ts`, `app/profile/edit/page.tsx`, `app/dashboard/connect/page.tsx`, `components/listings/recently-viewed-section.tsx`, `components/listings/load-more-button.tsx` |
| F-04 | P1 | `supabase/security-fixes-2026-06-04.sql`, `app/api/stripe/webhook/route.ts` |
| F-05 | P1 | `app/api/stripe/auto-capture/route.ts`, `supabase/security-fixes-2026-06-04.sql` |
| F-06 | P1 | `supabase/security-fixes-2026-06-04.sql` |

**Verificación:** `npx tsc --noEmit` sin errores tras todos los cambios.
