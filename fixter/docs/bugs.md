# Fixter — Historial de bugs y discrepancias

---

## Sesión 2026-06-02

No se encontraron bugs nuevos en esta sesión.

**Construido en esta sesión:**
- Sistema de valoraciones (`reviews` + `confirmed_buyer_id` en `listings`)
- Datos de prueba (`supabase/seed.sql`)
- Paginación cursor-based en home (botón "Cargar más")
- Sección "Vistos recientemente" en home (localStorage)

---

## Sesión 2026-06-03 — Revisión preventiva

### B-1 · `publish-form.tsx` — Precio 0 permitido por bug de validación

**Severidad:** Media  
**Archivos:** `components/listings/publish-form.tsx:199`, `components/listings/publish-form.tsx:403`  
**Descripción:** La validación de precio usaba `!price`, que es `false` para `"0"` (truthy en JS). El atributo HTML tenía `min="0"`. Un vendedor podía publicar un anuncio con precio 0.  
**Corrección:** Validación cambiada a `Number(price) <= 0`; atributo HTML a `min="0.01"`.  
**Estado:** Resuelto.

---

### B-2 · `app/messages/layout.tsx` — Query de mensajes sin límite de filas

**Severidad:** Media  
**Archivo:** `app/messages/layout.tsx:57`  
**Descripción:** La query que carga mensajes para el sidebar de mensajes no tenía `.limit()`. En cuentas con muchas conversaciones podría cargar miles de filas en cada render del layout.  
**Corrección:** Añadido `.limit(500)` a la query.  
**Estado:** Resuelto.

---

### B-3 · `supabase/fix-rls.sql` — Policy SELECT de listings con `USING (true)`

**Severidad:** Media  
**Archivo:** `supabase/fix-rls.sql:17`  
**Descripción:** El archivo tenía una sola policy `USING (true)` para SELECT en `listings`, exponiendo anuncios vendidos en home/búsqueda si alguien ejecutaba el script en un entorno nuevo. La policy correcta (split en 3) ya estaba en producción en `security-fixes-2026-06-03.sql`.  
**Corrección:** Reemplazada por las tres policies que reflejan el estado de producción: `status = 'active'` (público), `seller_id = uid` (vendedor), `confirmed_buyer_id = uid` (comprador confirmado).  
**Estado:** Resuelto (archivo actualizado; producción no se vio afectada).

---

### B-4 · `hooks/useOffers.ts` — Contador diario de ofertas usa reloj del cliente

**Severidad:** Media  
**Archivo:** `hooks/useOffers.ts:128`  
**Descripción:** `getDailyUsed()` calculaba la ventana de 24h con `Date.now()` del navegador, mientras que el trigger `trg_validate_offer` usa `now()` de PostgreSQL. La discrepancia de zona horaria podía hacer que el contador en UI mostrara un número diferente al que aplica el trigger.  
**Corrección:** Creada función RPC `get_daily_offer_count()` (SECURITY DEFINER, usa `now()` del servidor). `getDailyUsed()` ahora llama `supabase.rpc("get_daily_offer_count")`.  
**Estado:** Resuelto. RPC aplicada a producción.

---

### B-5 · `accepted-offer-price.tsx` — `.maybeSingle()` sin `.limit(1)` previo

**Severidad:** Baja  
**Archivo:** `components/listings/accepted-offer-price.tsx:33`  
**Descripción:** La query usaba `.maybeSingle()` sin `.limit(1)`. Si hubiera más de una oferta aceptada para el mismo listing (datos inconsistentes no impedidos por constraint DB), la query lanzaría un error en lugar de devolver la primera.  
**Corrección:** Añadido `.limit(1)` antes de `.maybeSingle()`.  
**Estado:** Resuelto.

---

## Discrepancias conocidas (pre-existentes)

### D-1 · `lib/listings.ts` — Dead code

`uploadListingImages()`, `createListing()` y `validatePublishInput()` exportados en `lib/listings.ts` no se usan en ningún sitio. `publish-form.tsx` realiza el upload e insert inline.

**Estado:** Sin resolver. No afecta al funcionamiento.

---

### D-2 · `components/listings/image-upload-field.tsx` — Dead code

El componente `ImageUploadField` no se importa en ningún sitio del proyecto.

**Estado:** Sin resolver. No afecta al funcionamiento.

---

### D-3 · `shipping_available` en publish-form.tsx vs schema

`publish-form.tsx` inserta el campo `shipping_available` en la tabla `listings`, pero ese campo no está listado en el schema de CLAUDE.md. Puede ser que exista la columna en la DB pero no esté documentada, o que Supabase lo ignore silenciosamente.

**Estado:** Sin verificar. Investigar si la columna existe en la tabla real antes de confiar en su valor.
