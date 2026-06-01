# Fixter — Historial de bugs y discrepancias

---

## Bugs corregidos

### BUG 1 — `ensureUserProfileById` pasaba tipos incorrectos ✓ (2026-05-31)
**Archivo**: `lib/profiles.ts:107`
Pasaba `metadata?.full_name?.trim()` (string) como tercer argumento de `insertProfile`,
que espera `{ username?, full_name? }`.
**Fix**: pasa `metadata` completo + `metadata?.full_name?.trim()` como `fallbackName`.

### BUG 2 — Ruta de editar anuncio no existía ✓ (2026-05-31)
**Archivo**: `app/dashboard/ListingActions.tsx`
Enlace apuntaba a `/listings/{id}/edit` → 404.
**Fix**: construido `app/listings/[id]/edit/page.tsx` + `components/listings/edit-listing-form.tsx`.
Server Component verifica sesión y propiedad. Redirige a `/dashboard` si no es el vendedor.

### BUG 3 — Double-fetch en `generateMetadata` ✓ (2026-05-31)
**Archivos**: `app/listings/[id]/page.tsx`, `app/profile/[username]/page.tsx`
`getListingById` y `getProfileByUsername` se llamaban dos veces por request.
**Fix**: `cache()` de React a nivel de módulo deduplica la query en el mismo request.

### BUG 4 — Imágenes huérfanas en Storage ✓ (2026-05-31)
**Archivo**: `components/listings/publish-form.tsx`
Upload antes del INSERT sin cleanup si fallaba.
**Fix**: `uploadedPaths[]` acumula paths; si falla upload o INSERT → `storage.remove(uploadedPaths)`.

### BUG 5 — Inyección en filtro de búsqueda ✓ (2026-05-31)
**Archivo**: `lib/listings-queries.ts`
String de usuario interpolado directamente en `.or()` de PostgREST.
**Fix**: `filters.search.replace(/[,()]/g, "")` elimina delimitadores antes de interpolar.

---

## Discrepancias corregidas

### MAX_IMAGES unificado ✓ (2026-05-31)
`publish-form.tsx` tenía `const MAX_IMAGES = 6` local.
**Fix**: importa `MAX_LISTING_IMAGES = 8` de `lib/constants/categories.ts`. Límite efectivo: 8.

### `condition` faltaba en `ListingRow` ✓ (2026-05-31)
**Fix**: `condition: string | null` añadido a `ListingRow` y a `LISTING_FIELDS`.

---

## Comportamientos especiales del sistema de valoraciones

### ReviewFormModal no usa router.refresh() tras el INSERT
La card de compra (`PurchaseCard`) actualiza su estado local `review` directamente tras el INSERT exitoso. No hace `router.refresh()` — el cambio es optimista y no requiere re-fetch del Server Component.

### getReviewSummary carga todos los ratings sin LIMIT
`lib/profile-queries.ts:getReviewSummary` trae todos los `rating` de la tabla y calcula el promedio en Node. Con volumen alto debería delegarse a una RPC de Postgres. Pendiente optimizar (no urgente en MVP).

### add-reviews-and-profile-fields.sql obsoleto
Archivo de migración anterior que tiene policies permisivas (UPDATE/DELETE en reviews) y sin verificación de `confirmed_buyer_id`. No ejecutar — está supersedido por `create-reviews-schema.sql`.

---

## Discrepancias conocidas (sin corregir)

### `lib/constants/categories.ts` no es fuente de verdad del schema
Los componentes definen sus propios arrays con slugs (`"pantallas"`, `"baterias"`).
`constants/categories.ts` tiene display names (`"Pantalla"`, `"Batería"`).
Los slugs son los que llegan a la DB — nunca usar los display names en queries.

### `lib/listings.ts` es dead code
`uploadListingImages()`, `createListing()`, `validatePublishInput()` no se importan
en `publish-form.tsx` — el formulario tiene lógica inline propia.

### `image-upload-field.tsx` es dead code
`components/listings/image-upload-field.tsx` no se importa en ningún archivo.