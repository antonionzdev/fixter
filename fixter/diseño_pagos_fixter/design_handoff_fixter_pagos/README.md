# Handoff: Fixter — Flujo de Pagos (Mobile + Desktop)

## Overview

This package contains two **high-fidelity HTML design prototypes** for the Fixter marketplace payment flow — a peer-to-peer repair parts platform. The flow covers the full escrow-based transaction cycle: from checkout through delivery confirmation, including the seller view and a dispute/claims flow.

> **Important:** These HTML files are **design references**, not production code. Your task is to recreate these designs in your existing codebase (React, Next.js, etc.) using your established patterns, routing, and component libraries. Do not ship the HTML directly.

---

## Files in this Package

| File | Description |
|------|-------------|
| `Fixter Pagos.html` | Mobile prototype — rendered inside an iOS device frame |
| `Fixter Pagos Desktop.html` | Desktop prototype — full browser layout |

Both prototypes share identical screens and logic; the difference is layout adaptation for each breakpoint.

---

## Fidelity

**High-fidelity.** Pixel-accurate colors, typography, spacing, and interactions are final. Recreate the UI as close to pixel-perfect as your component library allows. All copy (Spanish) is final.

---

## Design Tokens

```
Colors:
  --orange:   #FF6B2B   (primary action, accent)
  --black:    #0F0F0F   (text, CTA backgrounds)
  --gray-50:  #FAFAFA   (input backgrounds)
  --gray-100: #F3F4F6   (subtle fills, dividers)
  --gray-200: #E5E7EB   (borders)
  --gray-400: #9CA3AF   (secondary icons, labels)
  --gray-500: #6B7280   (secondary text)
  --green:    #059669   (success states)
  --red:      #DC2626   (error states)
  --page-bg:  #F5F5F2   (desktop page background)

Typography:
  Font family: Plus Jakarta Sans (Google Fonts)
  Weights used: 400, 500, 600, 700, 800

Spacing / Radii:
  Card border radius: 16px (mobile), 18px (desktop)
  Input border radius: 11px (mobile), 10px (desktop)
  Button border radius: 14px (mobile), 12px (desktop)
  Pill border radius: 20px
  Card border: 1px solid #E5E7EB
  Card padding: 16px (mobile), 24px (desktop)

Shadows: none used — borders only
```

---

## Screens / Views

### 1. Checkout (`/checkout`)

**Purpose:** Buyer enters card details and reviews order summary before paying.

**Layout (Desktop):** Two-column grid (`1fr 360px`), max-width 1040px, centered. Left = payment form, Right = order summary sidebar.

**Layout (Mobile):** Single column, scrollable. Product card → order summary → card form → CTA.

**Components:**

- **Site Header (desktop):** sticky, 64px tall, white bg, `fixter` wordmark left, 3-step stepper centered (active step = step 2 "Pago"), "Pago seguro SSL" + lock icon right. Steps: `Datos del pedido → Pago → Confirmación`.
- **Top Bar (mobile):** sticky 52px, white, "Pago seguro" centered, lock icon right (28×28 gray-100 bg, 8px radius).
- **Product Card:** 68×68px gray-100 rounded placeholder (phone icon gray-400), product name 15px/700, seller handle + star rating 13px gray-400, price 18px/800.
- **Order Summary Card:** Rows: `Precio artículo €89,99`, `Comisión Fixter (8%) €7,20` (orange accent), `Envío estimado €3,99`. Total row: 16px/700 label + 20px/800 value. `Total: €101,18`.
- **Escrow notice:** Orange-tinted card (`#FF6B2B08` bg, `#FF6B2B30` border), shield icon + 2-line copy.
- **Card Form:** Fields: Número de tarjeta (with card icon right), Vencimiento + CVV (side-by-side 50/50), Titular. Input style: 1.5px border, orange on focus, gray-50 bg, 13–14px.
- **CTA:** Full-width black button "Pagar €101,18" (16px/700). Below: ghost "Simular pago fallido →" in gray-400.
- **Trust row:** Lock + "Cifrado SSL", Shield + "Compra protegida", Card + "3D Secure" — 12px gray-400, centered.

---

### 2. Confirmación exitosa (`/checkout/success`)

**Purpose:** Payment accepted. Shows order summary and escrow notice.

**Layout:** Centered single column, max-width 640px.

**Components:**

- Orange circle (80px) with white checkmark SVG.
- H1: "¡Pago realizado!" 28px/800.
- Subtitle: 15px gray-500.
- Details card: 4 rows — Nº pedido `#FX-2847`, Artículo, Vendedor `@carlos_fix`, Total `€101,18`.
- Orange escrow badge: `€89,99 retenidos en escrow…`
- CTAs: Primary "Ver seguimiento del pedido" + Outline "Seguir comprando".

---

### 3. Seguimiento (`/orders/:id/tracking`)

**Purpose:** Buyer tracks shipment in real time.

**Layout (Desktop):** Two-column grid (`1fr 300px`). Left = timeline. Right = product card + tracking number + ETA + CTA.

**Layout (Mobile):** Single column, all stacked.

**Components:**

- **Timeline (5 steps):**
  1. ✓ Pedido confirmado — `Hoy, 10:23h`
  2. ✓ Pago retenido en escrow — `Hoy, 10:23h · Fixter protege tu compra`
  3. ✓ En preparación — `Vendedor empaquetando el artículo`
  4. ● En tránsito *(active, orange)* — `ES123456789MX · Correos Express`
  5. ○ Entregado — `Estimado: jueves 6 de junio`
  - Done steps: black circle with white ✓, black connector line.
  - Active step: orange circle with white dot inside.
  - Pending: gray-200 circle, gray connector.
- **Tracking number card:** Monospace `ES123456789MX` 18px/800, `Correos Express` 13px gray-400. "Copiar" button → toggles to "✓ Copiado" (orange tint) for 1.5s.
- **ETA banner:** Orange-14 bg, truck icon, "Entrega estimada: jueves 6 de junio".
- **CTA:** Black "He recibido el pedido".

---

### 4. Confirmar recepción (`/orders/:id/receive`)

**Purpose:** Buyer confirms item received → triggers escrow release.

**Layout:** Centered, max-width 580px.

**States:**
- `idle` → box icon, warning about releasing funds.
- `loading` → "Procesando…" for 1.2s.
- `done` → green check icon, success banner, auto-advance after 1s.

**Components:**

- Icon circle: 76px, gray-100 idle / green-tinted done.
- H2: "¿Has recibido tu pedido?" idle / "¡Pago liberado!" done.
- Warning banner (idle): `#FFFBF5` bg, `#FFD9B3` border, amber warn icon, copy about releasing €89,99.
- Success banner (done): `#F0FFF8` bg, `#A7F3D0` border, green check, "Transacción completada con éxito".
- Product card (compact).
- CTAs (idle): Primary "He recibido el pedido" + Ghost "Hay un problema con mi pedido" in red.

---

### 5. Pago fallido (`/checkout/failed`)

**Purpose:** Card declined — shows error and retry options.

**Layout:** Centered, max-width 580px.

**Components:**

- Red circle (`#FEE2E2`) with ✕ SVG in `#DC2626`.
- H2: "Pago fallido" 26px/800.
- Error code badge: `CARD_DECLINED` monospace, gray-100 bg pill.
- Causes grid (desktop 2×2 / mobile list): Fondos insuficientes, Número/CVV incorrectos, Tarjeta bloqueada, Límite superado — each with icon + gray text.
- CTAs: Primary "Reintentar pago" + Outline "Otro método de pago" + Ghost "Contactar soporte".

---

### 6. Reclamación — Tipo (`/orders/:id/claim`)

**Purpose:** Buyer selects problem type before submitting a claim.

**Layout (Desktop):** Max-width 680px, problem options in 2×3 grid.

**Layout (Mobile):** Single column list.

**Options (6):**
1. No he recibido el artículo (truck)
2. El artículo está dañado o defectuoso (warn)
3. El artículo no coincide con la descripción (tag)
4. Me han enviado el artículo incorrecto (alertCircle)
5. Falta contenido en el paquete (box)
6. Otro problema (alertCircle)

**Selection style:** Selected = orange border 1.5px + `#FF6B2B08` bg + orange icon bg + orange label 700. Unselected = gray-200 border + gray-100 icon bg.

**CTA:** "Continuar" — opacity 0.35 until a selection is made.

---

### 7. Reclamación — Formulario (`/orders/:id/claim/form`)

**Purpose:** Buyer adds photos and describes the problem.

**Layout (Desktop):** Two-column `1fr 320px`. Left = form. Right = product sidebar + info note.

**Components:**

- Problem type pill (orange bg-10, alertCircle icon, orange label).
- Photo upload area: 120px height, dashed border → green on upload, click to toggle `hasPhoto` state.
- Textarea: 5 rows, orange border on focus, 500 char limit + counter bottom-right.
- Info note: gray-50 bg, lock icon, escrow retention message.
- CTA "Enviar reclamación" — opacity 0.35 if `desc.trim().length <= 10`.

---

### 8. Reclamación enviada (`/orders/:id/claim/sent`)

**Purpose:** Confirmation that claim is under review.

**Layout:** Centered, max-width 580px.

**Components:**

- Orange-50 circle, shield icon orange.
- H2: "Reclamación enviada".
- Details card: Nº reclamación `#REC-1042`, Pedido `#FX-2847`, Estado `En revisión por soporte` (orange text), Respuesta estimada.

---

### 9. Vista Vendedor (`/seller/sales/:id`)

**Purpose:** Seller adds tracking number and monitors escrow status.

**Layout (Desktop):** 4-stat grid (full width) + two-column content below (`1fr 400px`).

**Stats row (desktop 4 cols / mobile 3 cols):**
- Valoración media: `4.9`
- Ventas totales: `82`
- En curso (desktop only): `3`
- Recibirás: `€82,79`

**Left card — sale + payment:**
- Product row: 60px phone placeholder, name, buyer handle, status pill.
- Payment breakdown: Precio €89,99 → Comisión −€7,20 (orange) → Recibirás **€82,79**.
- Escrow badge: orange, changes copy once tracking is submitted.

**Right card — tracking input:**

*Before send:*
- Carrier chip selector (6 options: Correos, Correos Express, SEUR, MRW, DHL, GLS). Active = orange border + bg.
- Monospace input for tracking number (auto-uppercase).
- "Confirmar envío" — disabled (opacity 0.35) until > 5 chars entered.

*After send:*
- Displays tracking number + carrier + "Enviado" green pill.
- Mini 3-step timeline: ✓ Tracking enviado → ● Esperando confirmación → ○ Pago liberado.

---

## Navigation / Screen Flow

```
Comprador:
  checkout → success → tracking → receive → (success)
  checkout → failed → checkout
  receive → problem-type → problem-form → problem-sent

Vendedor:
  seller (standalone view)
```

---

## Interactions & Behavior

| Interaction | Detail |
|-------------|--------|
| Card input formatting | Groups of 4 digits separated by spaces, max 16 digits |
| Expiry formatting | Auto-inserts `/` after MM |
| CVV | Password type, max 4 digits |
| Copy tracking number | Button state toggles for 1500ms |
| Confirm receipt | 1200ms loading → done state → auto-navigate after 1000ms |
| Carrier selection | Single-select chip group |
| Tracking submit | Enabled when input > 5 chars |
| Claim form submit | Enabled when description > 10 chars |
| Form field focus | Orange border on focus, gray-200 default |

---

## Assets

- **Icons:** All inline SVG. No external icon library needed. See the `Ic` object in the HTML files for the full set: `phone`, `lock`, `shield`, `truck`, `box`, `warn`, `checkCircle`, `card`, `alertCircle`, `ban`, `bank`, `star`, `camera`, `tag`.
- **Product image:** Placeholder (gray-100 box + phone icon). Replace with real product photo.
- **Logo:** Text wordmark `fixter` — 22px/800, letter-spacing -0.5px, black.

---

## Implementation Notes

- The escrow/retention concept is central to Fixter's trust model — surface it prominently at checkout, in the order summary sidebar, and in the seller view.
- The `€89,99` product price, `8%` commission, and `€3,99` shipping are hardcoded in the prototype; wire to real data in implementation.
- Both prototypes include a **prototype nav bar** (dark pill/top bar) for switching screens during review — this should **not** be implemented in production.
- The `TweaksPanel` sidebar is also prototype-only.
