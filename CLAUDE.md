# Valhalla menu site

Menu and WhatsApp ordering site for Valhalla, a chimney cake cafe in Egypt. Rebuild, because the previous developer never handed over the source. Owner is non-technical and must be able to run the content himself.

`PROMPT.md` is the original brief. This file holds the decisions that outlive it. Where they disagree, this file wins.

## Data

- Supabase is the source of truth. `menu.json` is the seed and the rollback, nothing more.
- Never hardcode a price, an item name, or a category name into a component. If a string would change when the owner changes it, it comes from the database.
- Expected row counts after seeding: 15 categories, 134 menu_items (118 flat price, 16 sized), 32 item_sizes. If a change moves these, say so out loud.
- Seeds are idempotent and must not clobber prices the owner has edited since the last run.

## Availability

`is_available = false` renders the card **dimmed with the add control disabled**, not hidden. This is how the cafe marks something sold out mid-shift. Consequences that follow from it and must not be undone:

- Anonymous select on `menu_items` and `item_sizes` is **not** gated on `is_available`. The front end decides presentation, the database does not filter it away.
- Only `categories` is gated, on `is_active`.
- Disabled means `aria-disabled`, not keyboard reachable, not clickable through the dimming. Greying it visually is not enough.

## Cart

- localStorage holds item id, size label and quantity only. Never prices, never names. Both are resolved from server data at render.
- A cart that has sat in a browser for weeks must never send an order at weeks-old prices. This is the single most damaging bug this project can ship.
- Version the storage key so a shape change invalidates old carts instead of crashing on them.
- A restored cart referencing a deleted or unavailable item drops that line and tells the user what was removed.

## Security

- `service_role` key never appears in a client component, in any `NEXT_PUBLIC_` variable, or in the repo. `.env.local` only, gitignored, with a committed `.env.example` holding empty values.
- Anonymous role has select and nothing else. No anonymous insert, update or delete anywhere, including storage.
- The `menu-images` bucket is public read via its `public` flag. Do not add a `storage.objects` select policy back, it re-enables bucket listing.
- Writes happen through the dashboard under the owner's own login, or through `service_role`-only RPCs.
- Run `get_advisors` for security and performance after any schema change and fix findings before moving on.

## Migrations

- Never edit an applied migration. Fix forward with a new one.
- RLS goes in the same migration as the table it protects.
- The price-or-sizes rule is enforced by deferred constraint triggers, not a CHECK, because it spans two tables. Converting an item between flat price and sized needs both statements in one transaction.

## Content

Do not invent opening hours, delivery zones, neighbourhood names, founding years, review counts, chef names, or awards. Nothing about this business is known beyond what is in `menu.json`. If a section wants that content, leave a commented TODO and raise it.

Real facts: phone `01000100115`, WhatsApp `201000100115`, Instagram `valhalla_chimney`, Facebook `ValhallaChimney`, TikTok `@Valhallaeg`. Tax note near prices in both languages: "Prices include taxes" / "السعر شامل القيمة المضافة".

## Design

The `taste-skill` (`design-taste-frontend`) governs the marketing surfaces. Its Section 14 pre-flight check is the gate before declaring anything done. Do not force landing-page composition onto a 134 item catalogue that people need to scan fast.

**Full redesign (2026-07-29), superseding the Fire-Lit Hall pass entirely.** `REDESIGN.md` is the brief for this pass and replaces the Design section as it stood before. Schema, RLS, advisors, storage, the seed pipeline, `menu.json`, the WhatsApp order flow, the price-or-sizes constraint and `is_available` behaviour are unaffected. Unlike the previous "visual language only" pass, this one does touch IA: item detail is a real route now, not just a card-open callback, and navigation moved to a bottom bar on phone/tablet. See below.

Dials, split by surface:
- Marketing surfaces (hero, footer): `DESIGN_VARIANCE 8`.
- Menu grid: `DESIGN_VARIANCE 6`. Scanning 134 items fast is not negotiable.
- `MOTION_INTENSITY 5` everywhere, no GSAP, no ScrollTrigger, no scroll hijack.
- `VISUAL_DENSITY 5`.

**Brand colour: rose, not ember. Ember is dropped.** Fire-Lit Hall's neutral ramp (warm charcoal/brass) is untouched, it was never ember-coloured to begin with. Only the accent ramp changed, back to a deep saturated rose anchored on `#be185d`, the old site's own `theme-color` meta value, this time picked deliberately rather than inherited: it sits far enough from the photo corpus's pale pink template panel (`#ea87b7`) to read as a separate colour, not a wash of the same pink. The pink panel itself is no longer something to remove, REDESIGN.md withdrew that instruction. Verified computationally, not eyeballed:
- accent-600 (`#be185d`) vs white button text: 6.04:1. accent-700 (`#9d174d`) vs white: 7.88:1. Both pass 4.5:1.
- accent-700 as body text on the light `bg-page`: 7.08:1.
- accent-600 as body text on the **dark** `bg-page`: only 3.11:1, fails 4.5:1. This is the "warm mid-tone fails body text" case REDESIGN.md predicted, it just lands in dark mode for this hue rather than light mode. `--accent-text` in dark mode uses accent-400 (`#e56ba0`, 6.20:1) instead of mirroring the button-fill shade, for this reason.
- accent-600 vs the pale photo panel `#ea87b7`: 2.49:1 contrast, Euclidean RGB distance 149.5/441. Confirmed visually too against Kinder, Red Velvet, Strawberry (mojito) and Blue Curacao, the three named hard cases, at 390px: no muddying, because the card's rose elements (the Popular ribbon, the price in the footer plate) never sit over large areas of photo, only a corner ribbon and a separate plate below the image.
- The floating add-button-over-the-photo scenario REDESIGN.md asked to check doesn't exist in the shipped design: add-to-cart lives entirely on the item detail page/modal now, below the photo, not layered on top of it as a FAB. What's verified instead is the Popular ribbon and the price, which are the rose elements that do sit against the panel.

**The template's white wave, taken control of, not removed.** Sampled the real pixels (Kinder, via storage): the wave is flat `#ffffff`, at least 116px deep in a 1600px source image, too tall to crop past without cutting into the product itself (tried, `-mt-16` still showed wave and clipped the cup). The fix: the card's footer plate is pinned to `--surface-fixed-light` (`#ffffff`, a token that deliberately does not participate in the light/dark flip, see `app/globals.css`), not the theme-reactive `--bg-surface`. In light mode this looks identical to before. In dark mode it means the plate stays white while the rest of the card goes dark, matching the wave's own baked-in colour instead of fighting it. Name and price text inside that plate are fixed dark-on-light for the same reason (`--color-neutral-600`, `--color-accent-700`), not the theme-flipping semantic tokens.

**Typography rebuilt from scratch, not inherited.** Outfit and Plus Jakarta Sans are gone. Display face is Bricolage Grotesque (real ink-trap character at the large sizes the hero and footer's background wordmark now depend on), body is Public Sans. Cairo stays for the bilingual strings. `--text-display-lg` is a clamp tuned so the two-line hero headline actually holds to two lines at all four required breakpoints (it does not scale linearly with viewport width without breaking that, verify at 390/768/1024/1440 again if it's ever touched, a naive fluid clamp overflowed to four lines at 1024 the first time this was built).

**Photography is reserved for the menu card and the item detail page. Nothing else.** No food photo in the hero or footer, both are type, colour and form: an oversized, low-contrast "VALHALLA" wordmark bleeds off one edge as background texture (right in the hero, left in the footer, so the two bookends rhyme rather than repeat), with the real readable content in front of it, not centred.

**Item detail is a real, deep-linkable route now** (`app/item/[id]`), not a client-state modal. Reached directly (a shared WhatsApp link, a refresh), it's a full standalone page with its own metadata (title, description, `og:image`) for link previews. Reached from the grid, it's intercepted and rendered as an overlay via `app/@modal/(.)item/[id]`, same bottom-sheet-below-`lg`/floating-panel-at-`lg`-and-up split as the cart. Both share `ItemDetailContent`. Cart state lives in a context provided at the root layout (`lib/cart/cart-context.tsx`) now, not local state in `PageShell`, because the modal route shares no client ancestor with the main page tree otherwise.

**Navigation moved to a bottom bar on phone and tablet** (menu / search / cart), matching the one-handed reachability argument in REDESIGN.md: the bottom centre of the screen is the comfortable arc, the top corners are the hardest to reach. The top header is wordmark and theme toggle only below `lg`. At `lg` (1024) and up, tablet-landscape and desktop, the bottom bar disappears, the horizontal category rail is replaced by a persistent left sidebar beside the grid, and the cart button returns to the header, matching "tablet is not a big phone, a stretched phone column is not a real tablet layout."

- One accent, one radius system, one neutral family. One theme across the whole page, light and dark both fully designed.
- Zero em-dash characters anywhere a user can see, including WhatsApp order text and alt text.
- "Order on WhatsApp" is the label for that action everywhere on the page. One label per intent.
- Mobile first, designed at 390px. iPad is a primary target: 768 and 1024 are first-class designed breakpoints with their own layouts (768 gets its own grid density, not phone-stretched; 1024 gets the sidebar, not the horizontal rail), verified against real full categories (Sweet Cones/10, Savory/11, Extras/13), not demo items. Minimum 44px touch targets everywhere, checked computationally against real rendered boxes, not eyeballed. Nothing important sits behind hover only.
- `prefers-reduced-motion` collapses all motion, handled once via `MotionConfig reducedMotion="user"` in `app/layout.tsx`, not per-component branching.

## Known decisions, do not relitigate

- `npm run dev` no longer passes `--turbopack`. Verified directly: with Turbopack, navigating to an intercepted route (`app/@modal/(.)item/[id]`, see Design) does not intercept at all, it does a full client-side route swap that blows away the grid behind it, no dialog, no preserved page. The exact same navigation against plain webpack `next dev` intercepts correctly, dialog present, grid preserved behind it, verified with real Playwright checks against both. `next build` was already plain webpack (never had the flag), so production is unaffected either way. Don't re-add `--turbopack` to dev without re-verifying this first, it's a real, currently-reproducible gap in this Next.js version, not a config mistake here.
- `npm audit` reports high findings in dev-only and build-time transitives. `--force` would downgrade Next 15 to Next 9. Left alone deliberately.
- Project region is `eu-west-1` rather than `eu-central-1`. Pages are ISR, so the database is a build-time dependency and images sit behind a CDN. Not worth recreating the project.
- Every item owns its own storage object even where nine items share a source photo, so replacing one photo never affects another card.
- Google Maps' key-less embed trick (`google.com/maps?q=...&output=embed`, and the `maps.google.com` variant) is dead, it 404s now. A real Google Maps embed needs a paid Maps Embed API key, which nobody has provided. The footer embeds OpenStreetMap instead (free, no key, actually renders), fine for this traffic level. The "get directions" link still points at Google Maps since that's what most customers already have installed. Don't re-attempt the key-less Google embed, it will not come back to life.
