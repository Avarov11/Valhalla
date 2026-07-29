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

**Redesign mode (2026-07-28): overhaul, visual language only.** Content, IA, schema, data, and security are unaffected and stay exactly as built, this is surfaces only: background, card, cart, and item detail get rebuilt against whichever brand direction is picked, everything underneath them (RLS, advisor fixes, storage config, the cart's data model, the seed pipeline) is done and is not being revisited.

Dials, split by surface, not one number for the whole page:
- Marketing surfaces (hero, brand sections, the cone-builder entry, footer): `DESIGN_VARIANCE 8`.
- Menu grid: `DESIGN_VARIANCE 6`. Scanning 134 items fast is not negotiable regardless of how bold the rest of the page gets.
- `MOTION_INTENSITY 5` everywhere, no exceptions, no GSAP anywhere in this project.
- `VISUAL_DENSITY 5`.

**Brand colour: rose is not locked to the logo, resolved 2026-07-28 to Fire-Lit Hall.** Pulled the real logo from the old host and sampled it pixel by pixel: the chimney-cake mark and the "Valhalla" script are pure black ink. The pink is only that one export's background canvas fill (`#ea87b7`), and it doesn't match the `#BE185D` the old site itself declared in its `theme-color` meta tag either, that value was the previous developer's UI choice, not something sampled from the mark. Rose was free to move. Three directions (refined rose / fire-lit ember-charcoal-brass / a third option) were rendered with real Supabase data side by side; **Direction B, Fire-Lit Hall, was picked** (ember accent anchored on `#cc3d17`, charcoal/brass neutral ramp) and is live in `app/globals.css`. `design/tokens.css` is the superseded Step 1 sign-off snapshot, kept for history only.

- One accent (whichever gets picked). One radius system. One neutral family, chosen deliberately not inherited. One theme across the whole page, light and dark both fully designed.
- Zero em-dash characters anywhere a user can see, including WhatsApp order text and alt text.
- "Order on WhatsApp" is the label for that action everywhere on the page. One label per intent.
- Mobile first, designed at 390px, most customers are on mid-range Android over mobile data. iPad is now a primary target alongside phone: 768 and 1024 are first-class designed breakpoints, not just non-broken. Minimum 44px touch targets everywhere. Nothing important sits behind hover only, every hover affordance needs a touch equivalent.
- `prefers-reduced-motion` collapses all motion.

## Known decisions, do not relitigate

- `npm audit` reports high findings in dev-only and build-time transitives. `--force` would downgrade Next 15 to Next 9. Left alone deliberately.
- Project region is `eu-west-1` rather than `eu-central-1`. Pages are ISR, so the database is a build-time dependency and images sit behind a CDN. Not worth recreating the project.
- Every item owns its own storage object even where nine items share a source photo, so replacing one photo never affects another card.
- Google Maps' key-less embed trick (`google.com/maps?q=...&output=embed`, and the `maps.google.com` variant) is dead, it 404s now. A real Google Maps embed needs a paid Maps Embed API key, which nobody has provided. The footer embeds OpenStreetMap instead (free, no key, actually renders), fine for this traffic level. The "get directions" link still points at Google Maps since that's what most customers already have installed. Don't re-attempt the key-less Google embed, it will not come back to life.
