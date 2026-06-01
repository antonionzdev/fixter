# Fixter — Seguridad y comportamientos especiales

---

## Auditoría sistema de valoraciones (2026-06-01)

| Severidad | Problema | Fix aplicado |
|-----------|----------|--------------|
| 🔴 Crítico | Policy INSERT de reviews no verificaba que `reviewed_id = listing.seller_id` → un comprador confirmado podía imputar reviews a perfiles ajenos | Añadido `AND l.seller_id = reviewed_id` al EXISTS de la policy INSERT |
| 🔴 Crítico | `fix-rls.sql` y `fix-listings-update-rls.sql` recreaban `"Owners update own listings"` sin restricciones sobre `confirmed_buyer_id`, pudiendo sobreescribir la protección silenciosamente | Eliminado el `CREATE POLICY` de ambos fix files; solo existe en `create-reviews-schema.sql` |
| 🟠 Medio | Vendedor podía reasignar `confirmed_buyer_id` tras una review, habilitando reviews adicionales del mismo listing | Trigger `prevent_buyer_reassignment` (BEFORE UPDATE, SECURITY DEFINER): bloquea cambio si ya existe review para ese listing |
| 🟠 Medio | Sin constraint de tabla que garantizara `confirmed_buyer_id IS NULL OR status = 'sold'` | `CONSTRAINT listings_sold_if_buyer_set CHECK (confirmed_buyer_id IS NULL OR status = 'sold')` |
| 🟠 Medio | Sin constraint que impidiera `confirmed_buyer_id = seller_id` (vendedor como su propio comprador) | `CONSTRAINT listings_buyer_not_seller CHECK (confirmed_buyer_id IS NULL OR confirmed_buyer_id <> seller_id)` |
| 🟡 Bajo | Validación de rating en cliente solo comprobaba `=== 0`, no el rango completo | `rating < 1 \|\| rating > 5` en `review-form-modal.tsx` |

Verificados como seguros:
- `reviewer_id` en el INSERT viene de `auth.getUser()`, no del formulario
- `sellerId` prop en `PurchaseCard` y `ReviewFormModal` viene del Server Component (listing.seller_id de DB), no de input del usuario
- `UNIQUE(listing_id, reviewer_id)` impide doble review del mismo comprador
- `CHECK(reviewer_id <> reviewed_id)` impide auto-reseña directa
- RLS SELECT pública en reviews: correcto, usa `createServerSupabase()` (anon)
- Storage buckets: validación de `auth.uid()` en path intacta

### Migrations de reviews — orden de ejecución

Solo ejecutar `supabase/create-reviews-schema.sql`. Es idempotente (todos los DROP IF EXISTS).

Si por un error se ejecuta `fix-rls.sql` o `fix-listings-update-rls.sql`, ejecutar `create-reviews-schema.sql` inmediatamente después para restaurar la policy de UPDATE correcta.

`supabase/add-reviews-and-profile-fields.sql` es un archivo obsoleto (supersedido por `create-reviews-schema.sql`). Tiene policies de UPDATE/DELETE en reviews habilitadas — **no ejecutar**.

---

---

## Auditoría sistema de mensajería (2026-06-01)

| Severidad | Problema | Fix aplicado |
|-----------|----------|--------------|
| 🔴 Crítico | `WITH CHECK (true)` en `messages_update_read_at` permitía modificar body, sender_id de mensajes ajenos | `WITH CHECK (read_at IS NOT NULL)` + `GRANT UPDATE (read_at)` únicamente |
| 🟠 Medio | `seller_id` en conversations no validado contra el vendedor real del anuncio | Trigger `trg_validate_conversation_seller` (SECURITY DEFINER) |
| 🟡 Bajo | Race condition TOCTOU en contact-seller-button: doble tap → error 23505 visible | Captura `insertError.code === "23505"` → recupera conversación existente |

Verificados como seguros:
- Realtime `postgres_changes` aplica RLS — solo el participante recibe eventos de su conversación
- `.or()` con `user.id`: UUID de `auth.getUser()`, no inyectable

---

## Comportamientos especiales del sistema de mensajería

### El remitente recibe su propio mensaje via Realtime
Supabase Realtime envía el INSERT a todos los suscriptores, incluido el que hizo el INSERT.
Por eso `ChatView` NO añade el mensaje optimísticamente — espera recibirlo via Realtime.
Si se añadiera localmente Y se recibiese por Realtime → aparecería duplicado.

### Sidebar no actualiza en tiempo real
`MessagesShell` se hidrata con datos del Server Component y no tiene suscripción propia.
El `unreadCount` y `lastMessageBody` del sidebar no se actualizan sin recargar.
Comportamiento esperado en MVP.

### Mark-as-read tiene doble cobertura
1. **Server-side** al cargar `/messages/[id]`: UPDATE batch de todos los no leídos.
2. **Client-side** en callback Realtime: UPDATE individual por cada mensaje nuevo entrante.

### Layout usa `h-dvh`
`app/messages/layout.tsx` usa `flex h-dvh flex-col overflow-hidden`.
En móvil el SiteHeader incluye barra de búsqueda extra (`md:hidden`) que reduce el área de chat.
Comportamiento correcto — el layout se adapta via `flex-1`.