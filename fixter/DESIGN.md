---
name: Fixter
description: Marketplace C2C de piezas de reparación de iPhones para técnicos y aficionados en España y LATAM.
colors:
  brand-orange: "#FF6B2B"
  ink: "#111111"
  ink-deep: "#09090B"
  surface: "#FFFFFF"
  surface-subtle: "#FAFAFA"
  surface-specs: "#F9FAFB"
  border: "#E5E5E5"
  border-light: "#EEEEEE"
  muted: "#737373"
  muted-light: "#A3A3A3"
  success: "#16A34A"
  success-surface: "#F0FFF4"
  success-border: "#86EFAC"
  error-surface: "#FFF1F2"
  error-border: "#FECDD3"
  offer-surface: "#FFF5F0"
  offer-border: "#FED7AA"
typography:
  display:
    fontFamily: "Plus Jakarta Sans, system-ui, -apple-system, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Plus Jakarta Sans, system-ui, -apple-system, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Plus Jakarta Sans, system-ui, -apple-system, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Plus Jakarta Sans, system-ui, -apple-system, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "Plus Jakarta Sans, system-ui, -apple-system, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
  price:
    fontFamily: "Plus Jakarta Sans, system-ui, -apple-system, sans-serif"
    fontSize: "3rem"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-0.03em"
rounded:
  sm: "6px"
  md: "10px"
  lg: "16px"
  xl: "20px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.ink-deep}"
    textColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    padding: "16px 24px"
  button-primary-hover:
    backgroundColor: "{colors.ink-deep}"
    textColor: "{colors.surface}"
  button-offer:
    backgroundColor: "{colors.brand-orange}"
    textColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "12px 24px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    rounded: "{rounded.xl}"
    padding: "12px 24px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "0"
  card-seller:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    padding: "20px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
---

# Design System: Fixter

## 1. Overview

**Creative North Star: "The Workshop Counter"**

Fixter's visual system is the glass counter at a specialist repair shop — where a knowledgeable technician scans parts quickly, trusts what they see, and makes confident decisions without friction. The interface is lean and credible: nothing decorative that doesn't earn its space, everything visible that the buyer needs to decide.

The palette is restrained on purpose. White surfaces, near-black type, and a single orange accent that appears where action is required. This is not a marketplace that shouts. It earns trust through consistent precision: condition badges that mean something, prices that are the largest element on the page, and seller ratings that appear without being hunted for.

This system explicitly rejects: the crowded promotional noise of AliExpress and generic Asian marketplaces; the glassmorphism gradients and startup-pitch copy of SaaS tools; the dusty functionality of Milanuncios and basic classifieds; the cold corporate template of Amazon and MediaMarkt. It should feel like it was built by and for people who actually repair iPhones.

**Key Characteristics:**
- Restrained color: one orange accent, near-black type, white surfaces, subtle gray hierarchy
- Price dominance: the listing price is always the visual protagonist of the sidebar
- Trust-first layout: condition badges, review scores, and seller stats appear near the primary action
- Mobile-native: full-width CTA buttons, thumb-reachable tap targets, density on desktop
- No decoration: motion only for state feedback, shadows only on hover or interactive lift

## 2. Colors: The Workshop Palette

A two-tone system anchored in near-black and white, with one orange accent and two semantic states (success green, offer amber).

### Primary
- **Workshop Orange** (`#FF6B2B`): The sole accent color. Used on primary CTAs, active states (sidebar nav selection, gallery thumbnail active border), unread message badges, offer buttons, required field markers, and the brand avatar fallback background. Never used decoratively. If it appears on more than 10% of a screen's surface, something is wrong.

### Neutral
- **Ink** (`#111111`): Body text, foreground color. Near-black, not pure black, to avoid optical harshness on white.
- **Ink Deep** (`#09090B` / zinc-950): Primary buttons and dark interactive elements. Darker than Ink to carry more visual weight.
- **Page Surface** (`#FFFFFF`): Page background. White only.
- **Subtle Surface** (`#FAFAFA`): Card hover backgrounds, filter hover, chat message zone. One step above white.
- **Specs Surface** (`#F9FAFB`): Specification panels, metadata blocks. Technical content background.
- **Border** (`#E5E5E5`): Card borders, input borders at rest.
- **Border Light** (`#EEEEEE`): Dividers, separators, chat header, sidebar dividers.
- **Muted** (`#737373`): Secondary text — metadata, timestamps, seller location, hint text.
- **Muted Light** (`#A3A3A3`): Tertiary text — very secondary info like relative time on product cards.

### Semantic
- **Success** (`#16A34A`): Accepted offer prices, confirmed purchase state, "Vendido" badge.
- **Success Surface** (`#F0FFF4`): Accepted offer card background.
- **Offer Amber** (`#FFF5F0` bg + `#FED7AA` border): Counter-offer card state.

### Named Rules
**The One Voice Rule.** The orange accent appears at most in one dominant interactive element per visible area. On the listing detail sidebar: either the "Hacer oferta" button OR the active thumbnail border — never both competing at full intensity simultaneously.

**The Semantic Green Rule.** Green (`#16A34A`) is reserved for accepted/confirmed states. Never use it for general success messages or decorative emphasis.

## 3. Typography

**Body Font:** Plus Jakarta Sans (with system-ui, -apple-system, sans-serif fallback)
**Display / Price Font:** Plus Jakarta Sans, weight 900 (font-black)

**Character:** A single humanist sans-serif family carries the entire hierarchy. This avoids the pairing clutter typical of marketplace sites while providing enough weight range (400 → 900) to create strong hierarchy within one family. The `font-black` (900) weight on prices is the deliberate authority move: the price is a number people need to make a decision, not a piece of prose.

### Hierarchy
- **Price Display** (900, 48px / 3rem, leading-none, tracking -0.03em): The listing price on detail pages and reviews summary. The heaviest element on any screen. No other text competes at this weight and size.
- **Headline** (700, 28px / 1.75rem, leading-tight, tracking -0.015em): Page titles ("Mis anuncios", dashboard h1). Fixed rem, not fluid.
- **Title** (700, 17px / 1.0625rem, leading-snug, tracking -0.01em): Card prices in the grid, section titles, modal headings.
- **Body** (400, 15px / 0.9375rem, leading-[1.6]): Listing descriptions, seller bios, message text. Max line length 65ch on prose.
- **Body Semibold** (600, 15px): Seller names, form field values, conversation usernames.
- **Label** (500, 12px / 0.75rem, leading-snug): Timestamps, condition text in cards, metadata — no uppercase, no tracking.
- **Hint** (400, 12px, `#737373`): Form hints, secondary guidance text. Never uppercase.

### Named Rules
**The No-Eyebrow Rule.** Section labels (h2 for "Descripción", "Detalles", filter group names, "Vistos recientemente") use `font-semibold text-sm text-zinc-700`. Never `uppercase tracking-wide/widest text-zinc-400`. The eyebrow pattern belongs to 2023-era scaffolding; it looks like AI-generated boilerplate.

**The Price Protagonist Rule.** The price on a listing detail is always `text-5xl font-black tracking-tight`. No other text on that page matches or exceeds this size.

## 4. Elevation

This system is flat by default. Surfaces rest at zero elevation. Shadows are rewards for state, not decoration.

Two shadows are defined:
- **Card ambient** (`0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06)`): Applied to product cards at rest. Very subtle — barely perceptible. Provides just enough lift to distinguish the card from the page.
- **Card hover** (`0 4px 16px 0 rgb(0 0 0 / 0.12), 0 2px 4px -2px rgb(0 0 0 / 0.08)`): Applied on card hover, combined with `translateY(-3px)`. The shadow widens and lifts with the card — the lift is the signal that this element is interactive.

Modals use `shadow-2xl` — a strong shadow to anchor the floating panel against the dimmed backdrop.

### Named Rules
**The Flat-By-Default Rule.** A resting element has either a single `border` OR a very subtle ambient shadow (`shadow-sm` max, 2px blur). Never both a colored border AND a wide shadow (M ≥ 16px blur) on the same element. That's the ghost-card pattern.

**The Responsive Shadow Rule.** Shadows change with state, not randomly. `shadow-card` → `shadow-hover` on hover, not the reverse.

## 5. Components

### Buttons
- **Shape:** Rounded extra-large (20px / rounded-xl) for full-width CTAs; rounded-lg (16px) for inline buttons.
- **Primary (dark):** `bg-zinc-950 text-white` — used for all main transactional actions: "Publicar anuncio", "Enviar mensaje", "Contactar vendedor", "Enviar oferta".
  - Hover: `opacity-90` only — no background color change.
  - Active: `scale-[0.97]` — tactile compression feedback.
  - Disabled: `opacity-40 cursor-not-allowed`.
  - Transition: `transition-[opacity,transform] duration-200 ease-out`.
- **Offer (orange):** `bg-[#FF6B2B] text-white rounded-lg` — used exclusively for "Hacer oferta" / "Contraofertar". Same hover/active rules as primary.
- **Ghost (outline):** `border border-zinc-200 text-zinc-500` — for "Ver perfil", "Ver anuncio", secondary actions. Hover: `bg-zinc-50 text-zinc-700`. Never use for primary actions.
- **Success (green):** `bg-[#16A34A] text-white` — reserved for "Comprar ahora" when a deal is accepted. Same hover/active rules.

**The One Button Rule.** Each card or modal has one primary action. Secondary actions are ghost buttons. Never two filled buttons side by side unless they carry equal weight (e.g. accept/reject in an offer).

### Cards / Containers
- **Product Card:** `rounded-[16px] border border-zinc-200 bg-white shadow-card`. Hover: `translateY(-3px) shadow-hover`. Image aspect ratio 4:3. Content padding: `p-3 sm:p-3.5`. Price is the first and largest element in the content area.
- **Seller Card (on detail page):** `rounded-2xl border border-zinc-200 bg-white p-5`. Seller avatar + name at top, horizontal rule, then stats, then action buttons. No shadow — the border is sufficient at this usage scale.
- **Dashboard Listing Card:** `rounded-xl bg-white shadow-sm`. Actions in a separate footer zone separated by a `border-t border-[#F0F0F0]`.
- **Offer Card:** `rounded-2xl` with state-specific colors. Accepted: green border + surface. Rejected: neutral gray. Countered: amber border + surface. Pending: white + very subtle border. Never use shadows on offer cards — they live in the chat zone which already has its own tonal layering.
- **Internal Padding:** Cards don't have uniform internal padding. Product cards: content at `p-3 sm:p-3.5`. Seller cards: `p-5`. Forms: `p-6`. Respect these — increasing padding makes cards feel like empty boxes.

### Inputs / Fields
- **Style:** `border border-zinc-200 bg-white rounded-[var(--radius-md)] px-4 py-2.5 text-sm text-zinc-900`. Shadow-sm optional for elevated contexts.
- **Focus:** `border-zinc-900` (border darkens to near-black) — no glow, no color shift. The border weight is the only signal.
- **Focus in filters:** `border-[#FF6B2B] shadow-[0_0_0_3px_rgb(255_107_43_/_0.10)]` — orange focus ring for filter inputs since they're the primary filtering tool.
- **Error:** `border-rose-400` with error message below. Error text: `text-rose-700` on `bg-rose-50` (not `text-zinc-600` on a colored background).
- **Placeholder:** `placeholder:text-zinc-400` — must have WCAG 4.5:1 contrast against white.
- **Disabled:** `opacity-50`.

### Navigation (Site Header)
- Sticky top bar, white background, `border-b border-zinc-200`.
- Logo left, search center, auth/nav right.
- Active nav state: text contrast increase (zinc-900 vs zinc-500 at rest).
- Mobile: search in its own bar, nav collapsed.

### Condition Badges
- Color-coded by condition slug: `nuevo` (emerald), `como_nuevo` (sky), `bueno` (amber), `aceptable` (zinc).
- Shape: `rounded-full px-2 py-0.5 text-xs font-medium`.
- Appear in product cards (top-right overlay on image in dashboard, inline in listing detail).

### Offer System
- Offer cards centered in chat stream, max-width 320px.
- Pending offers show three action buttons (Accept/Reject/Counter) for the seller.
- Counter-offer status uses an inline `rounded-full` pill tag: `bg-[#FF6B2B]/10 text-[#FF6B2B]` — no uppercase, no tracked spacing.
- Accepted offer price on detail page: strikethrough original price in zinc-400, accepted price in green-700 at `text-5xl font-black`.
- "Ver resumen de oferta" button only appears on offer cards in the chat (where the detail modal is useful), not as a standalone element.

### Messaging / Chat
- Sidebar: 340px on desktop, full-width on mobile. Active conversation: `bg-[#F5F5F5]` + left `border-l-[3px] border-l-[#FF6B2B]`.
- Message bubbles: own messages dark (`bg-[#111111] text-white`), others white with border. Bubble radius: `18px 18px 4px 18px` (own) / `18px 18px 18px 4px` (other).
- Read receipt: SVG double-check in orange for read, single-check in muted for sent.
- Chat header: 72px fixed height, listing thumbnail right-aligned.
- Offer button (buyer only): round icon button in the input area, SVG price tag icon in brand orange.

## 6. Do's and Don'ts

### Do:
- **Do** use `font-black` (900) for prices and only for prices. This weight is reserved exclusively for numbers that drive purchase decisions.
- **Do** use `text-sm font-semibold text-zinc-700` for section labels (h2 inside content areas). Never add `uppercase` or `tracking-wide/widest`.
- **Do** use the orange accent (`#FF6B2B`) for exactly one dominant interactive element per visible viewport area. Its rarity signals priority.
- **Do** ensure error messages on colored backgrounds use the background's own hue: `text-rose-700` on `bg-rose-50`, not `text-zinc-600`.
- **Do** specify exact animated properties: `transition-[opacity,transform]` instead of `transition-all`.
- **Do** use SVG icons for all interactive affordances (offer button, close buttons, empty states, upload dropzone). No emoji substitutes.
- **Do** show condition badges, review scores, and seller metadata near (or above) the primary action button. Trust signals must be visible before the decision point.
- **Do** use `active:scale-[0.97]` on all actionable buttons for tactile feedback.

### Don't:
- **Don't** use AliExpress-style crowded layouts: price banners stacked over images, multi-colored badge clusters, promotional overlays. Every element on screen should earn its space.
- **Don't** use SaaS-startup patterns: glassmorphism, `background-clip: text` gradient text, hero metrics with big numbers and supporting stats, "supercharge your repairs" copy.
- **Don't** let the UI feel like Milanuncios or basic classifieds — functional but visually uncared. If condition badges and review scores look like afterthoughts, trust erodes.
- **Don't** make Fixter feel like Amazon or MediaMarkt: corporate, cold, warehouse-transactional. The seller is a person. Show their initial, their location, their rating.
- **Don't** use `uppercase` + `tracking-wide` on section labels, filter group headers, or any text that recurs across multiple sections. This is the AI scaffold eyebrow pattern.
- **Don't** use emoji anywhere in the UI. Use inline SVGs for icons and symbols, including check marks, upload icons, close buttons, and status indicators.
- **Don't** pair a colored `border` with a large box shadow (blur ≥ 16px) on the same element. Pick one: border or shadow.
- **Don't** use `border-radius` above 24px on product cards or form sections. Cards top out at `rounded-2xl` (24px) for offer cards; standard cards use `rounded-xl` (20px) or `rounded-lg` (16px).
- **Don't** repeat section title copy patterns: "Descripción" as a section heading doesn't need `text-xs uppercase tracking-widest text-zinc-400` above it. The heading IS the label.
- **Don't** use `transition-all` — always name the specific properties being animated.
- **Don't** use gradient text (`background-clip: text`). Solid colors only.
- **Don't** add placeholder illustrations (hand-drawn sketches, SVG doodles, stock art) when content is absent. Use structured empty states with a relevant icon SVG and a clear CTA instead.
