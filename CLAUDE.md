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

- localStorage holds item id, size label, selected addon option ids and quantity only. Never prices, never names, for the item, the size, or an addon. All of it is resolved from server data at render.
- A cart that has sat in a browser for weeks must never send an order at weeks-old prices. This is the single most damaging bug this project can ship. That now covers addon surcharges too, not just the base/size price.
- Version the storage key so a shape change invalidates old carts instead of crashing on them. `valhalla-cart-v2` (2026-07-31) added addon option ids; a v1 cart is simply not read back rather than guessed at.
- A restored cart referencing a deleted or unavailable item, a size that no longer exists, or an addon option that's been deleted or gone unavailable drops that line and tells the user what was removed.
- A cart line's identity is item + size + addon selection, not just item + size. The same drink with different extras is two lines, not one line with a bumped quantity.

## Item add-ons

Optional, per-item extras with their own surcharge ("Extra Sauce", "Extra Flavor", "Extra Boba Topping" on the old site, e.g. Ice White Mocha's sauce options at +30 EGP each). `item_addon_groups` belongs to a `menu_items` row; `item_addon_options` belongs to a group. A group is optional or required and single- or multi-select (`is_required`, `allows_multiple`), per group, not hardcoded, though every group seeded so far is optional and multi-select. Same `is_available` "dim, don't hide" rule as everywhere else, at the option level.

This is a different shape from the custom-build schema (`supabase/migrations/20260728164633_custom_build_schema.sql`): custom builds are a standalone product built from scratch (no base item, every step required in v1). Item add-ons bolt optional extras onto an *existing* catalog item. Don't conflate the two or try to merge their tables later, they answer different questions.

The custom-build migration's own header still says "DRAFT, NOT YET APPLIED... do not run db push until signed off", and per "never edit an applied migration" that comment is not getting touched now that it's wrong, but it *is* wrong: `supabase db push` batches every locally-pending migration into one prompt, so approving the 2026-07-31 item-addons push on 2026-07-31 also applied this one, nobody separately signed off on it. Tables exist live (`custom_builds`, `custom_build_steps`, `custom_build_options`), empty, RLS clean per `get_advisors`, no application code reads them, so nothing user-facing changed. But the actual cone-builder feature (UI, data, the "raised with the owner, not built" scope note in `get-menu.ts`) is still entirely unbuilt. Don't read the schema existing as the feature being greenlit.

Data entry for add-on groups/options happens through the dashboard, same as everything else, not through a script. One real example (Ice White Mocha) was seeded once from a screenshot to prove the feature end to end; its "Extra Boba Topping" group is known-incomplete (the screenshot cut off after one option), don't treat it as the full list.

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
- accent-600 vs the pale photo panel `#ea87b7`: 2.49:1 contrast, Euclidean RGB distance 149.5/441. Confirmed visually too against Kinder, Red Velvet, Strawberry (mojito) and Blue Curacao, the three named hard cases, at 390px: no muddying, because the card's rose elements (the Popular badge, the price in the footer) never sit over large areas of photo, only a small top corner badge and a separate block below the image.
- The floating add-button-over-the-photo scenario REDESIGN.md asked to check doesn't exist in the shipped design: add-to-cart lives entirely on the item detail page/modal now, below the photo, not layered on top of it as a FAB. What's verified instead is the Popular badge and the price, which are the rose elements that do sit against the panel.

**The template's white wave: status as of 2026-07-31, unresolved, do not silently pick a side.** Sampled the real pixels (Kinder, via storage): the wave is flat `#ffffff`, at least 116px deep in a 1600px source image, too tall to crop past without cutting into the product itself. An earlier pass pinned the card's footer to a dedicated `--surface-fixed-light` token so it stayed white under the wave in dark mode too. A later pass (2026-07-30, commit `bdf3caa`) removed that token and reverted the footer to the theme-reactive `--bg-surface`, reasoning that the negative-margin overlap carrying the plate was itself cutting into product on every non-template photo and that the plate was no longer needed once that overlap was gone. That reasoning conflates two separable decisions: removing the overlap (real bug fix, image and footer now stack flush, verified) and removing the fixed-white background under the footer text (a separate call). Checked directly against the current shipped code and real photos during the 2026-07-31 redesign/cleanup pass: in light mode `--bg-surface` is `#ffffff`, identical to the wave, so the footer reads seamlessly. In dark mode `--bg-surface` is `var(--color-neutral-900)` (`#241b16`), which does **not** match the wave's baked-in white, so every pink-panel-template photo (Kinder, Red Velvet, most of Sweet Cones/Sweet Classic/Milkshakes) shows a stray white scalloped shape at the bottom of the image sitting directly above a hard-edged dark footer in dark mode. This has not been fixed either direction. The two options are: bring back a fixed-white footer background (dark-on-light text pinning with it) until photos without the baked-in wave replace these, or accept the dark-mode seam as a placeholder-photo artifact. Decide and update this entry accordingly, do not let a future pass re-guess it from the code alone.

**Typography rebuilt from scratch, not inherited.** Outfit and Plus Jakarta Sans are gone. Display face is Bricolage Grotesque (real ink-trap character at the large sizes the hero headline depends on), body is Public Sans. Cairo stays for the bilingual strings. `--text-display-lg` is a clamp tuned so the two-line hero headline actually holds to two lines at all four required breakpoints (it does not scale linearly with viewport width without breaking that, verify at 390/768/1024/1440 again if it's ever touched, a naive fluid clamp overflowed to four lines at 1024 the first time this was built). These three faces are the whole type system. A same-day (2026-07-31) attempt loaded Kaushan Script for a hero/footer background wordmark; that wordmark was itself removed before the day was out (see Photography below), so the font never rendered anything live and was deleted, import, `<html>` variable and the `--font-script` CSS token together.

**Food photography is reserved for the menu card and the item detail page. Nothing else.** No food photo in the hero or footer, both are built from type, colour and form alone: headline, subtext, two CTAs in the hero, tagline, contact info, socials, and map in the footer, nothing else in either. Between 2026-07-29 and 2026-07-31 both sections also carried a giant low-contrast "VALHALLA" background wordmark bleeding off one edge as texture, tried three ways in turn (live text, then Kaushan Script, then a `val.png` raster image). Removed entirely by request on 2026-07-31, all three attempts, not just the last: neither `Hero.tsx` nor `Footer.tsx` references `val.png` anymore (the file itself is still on disk, unused, left alone rather than deleted without being asked). If a background device is wanted in either section again, that's a new decision built fresh, not a revival of live text, Kaushan Script, or val.png, all three were tried here and explicitly backed out.

**Item detail is a real, deep-linkable route now** (`app/item/[id]`), not a client-state modal. Reached directly (a shared WhatsApp link, a refresh), it's a full standalone page with its own metadata (title, description, `og:image`) for link previews. Reached from the grid, it's intercepted and rendered as an overlay via `app/@modal/(.)item/[id]`, same bottom-sheet-below-`lg`/floating-panel-at-`lg`-and-up split as the cart. Both share `ItemDetailContent`. Cart state lives in a context provided at the root layout (`lib/cart/cart-context.tsx`) now, not local state in `PageShell`, because the modal route shares no client ancestor with the main page tree otherwise.

**Navigation moved to a bottom bar on phone and tablet** (menu / search / cart), matching the one-handed reachability argument in REDESIGN.md: the bottom centre of the screen is the comfortable arc, the top corners are the hardest to reach. The top header is wordmark and theme toggle only below `lg`. At `lg` (1024) and up, tablet-landscape and desktop, the bottom bar disappears, the horizontal category rail is replaced by a persistent left sidebar beside the grid, and the cart button returns to the header, matching "tablet is not a big phone, a stretched phone column is not a real tablet layout."

**Menu card reversed to a delivery-app card, on purpose, by explicit request (2026-07-31).** REDESIGN.md's banned-patterns list names this exact shape ("rounded rectangle, photo on top, name, description, price and a small button in a row underneath... if the result contains any of them, it has failed") and description was deliberately dropped from the grid card for scannability. Both flagged directly before building, both re-confirmed by the owner anyway. Now: single-line `--accent-border-subtle` frame (not the old rose glow shadow, stacking a colour border under a colour glow read as a doubled frame), photo inset with its own `--radius-lg` corners and padding rather than flush to the card edge, Popular badge top-left and Sold-out badge top-right on the photo (mutually exclusive, an available item shows neither), price inline with the name in the footer row instead (name truncates, price `shrink-0`, so a long name never pushes the price off the card; briefly tried as a floating badge on the photo matching the reference's "$20" tag, moved back to the name row by a follow-up explicit request), description back under the name at `line-clamp-2` (2 lines, a practical constraint for 134 items with wildly different description lengths, not a re-litigation), and a full-width "Add to Cart" pill replacing the circular FAB. See `MenuItemCard.tsx`'s own comment before reverting or extending this further.

- One accent, one radius system, one neutral family. One theme across the whole page, light and dark both fully designed.
- Zero em-dash characters anywhere a user can see, including WhatsApp order text and alt text.
- "Order on WhatsApp" is the label for that action everywhere on the page. One label per intent.
- Mobile first, designed at 390px. iPad is a primary target: 768 and 1024 are first-class designed breakpoints with their own layouts (768 gets its own grid density, not phone-stretched; 1024 gets the sidebar, not the horizontal rail), verified against real full categories (Sweet Cones/10, Savory/11, Extras/13), not demo items. Minimum 44px touch targets everywhere, checked computationally against real rendered boxes, not eyeballed. Nothing important sits behind hover only.
- `prefers-reduced-motion` collapses all motion, handled once via `MotionConfig reducedMotion="user"` in `app/layout.tsx`, not per-component branching.

## Known decisions, do not relitigate

- The fixed-white footer plate / wave question is **not** a settled decision right now, see the "template's white wave" entry above in Design. `--surface-fixed-light` does not currently exist in `app/globals.css`, it was removed 2026-07-30. Do not treat its absence as proof it's unneeded, and do not re-add it on a hunch either. Read the entry above first.

- `npm run dev` no longer passes `--turbopack`. Verified directly: with Turbopack, navigating to an intercepted route (`app/@modal/(.)item/[id]`, see Design) does not intercept at all, it does a full client-side route swap that blows away the grid behind it, no dialog, no preserved page. The exact same navigation against plain webpack `next dev` intercepts correctly, dialog present, grid preserved behind it, verified with real Playwright checks against both. `next build` was already plain webpack (never had the flag), so production is unaffected either way. Don't re-add `--turbopack` to dev without re-verifying this first, it's a real, currently-reproducible gap in this Next.js version, not a config mistake here.
- `npm audit` reports high findings in dev-only and build-time transitives. `--force` would downgrade Next 15 to Next 9. Left alone deliberately.
- Project region is `eu-west-1` rather than `eu-central-1`. Pages are ISR, so the database is a build-time dependency and images sit behind a CDN. Not worth recreating the project.
- Every item owns its own storage object even where nine items share a source photo, so replacing one photo never affects another card.
- Menu grid columns are 2 up at 390, 3 at 768, 4 at 1024 and 1440 (`grid-cols-2 md:grid-cols-3 lg:grid-cols-4` in `MenuSection.tsx`). A 2026-07-30 pass had briefly matched the old site's own measured columns (2/4/5/5) instead; the 2026-07-31 pass reverted to 2/3/4/4 as the explicit spec for this redesign. If this gets touched again, that's the number to hit.
- Card and item-detail image box is 1:1, `object-contain`, not `object-cover`. Images are never cropped, the whole stored file always shows. Non-square photos letterbox inside the square instead of losing pixels. Letterbox background is `--bg-photo-panel`, the template pink (`#ea87b7`), fixed across both themes on purpose (see `app/globals.css`), so the bars disappear on pink-panel photos and stay neutral on the rest. Revisit back to `cover` once the photo corpus is replaced with square, wave-free shots that don't need a letterbox at all.
- Google Maps' key-less embed trick (`google.com/maps?q=...&output=embed`, and the `maps.google.com` variant) is dead, it 404s now. A real Google Maps embed needs a paid Maps Embed API key, which nobody has provided. The footer embeds OpenStreetMap instead (free, no key, actually renders), fine for this traffic level. The "get directions" link still points at Google Maps since that's what most customers already have installed. Don't re-attempt the key-less Google embed, it will not come back to life.
- The sandbox's own permission classifier blocks `supabase db push` (and presumably any other direct schema write) even with a service-role key available; it does not block plain data reads/writes through `@supabase/supabase-js` once a table exists. Schema changes need the human to run the push, or to grant the permission first. Don't keep retrying the same blocked command expecting a different result, surface it and wait instead. Not absolute though: a later, smaller `ALTER TABLE` migration (the ratings columns, 20260731165248) went through in the same session without being blocked, so this isn't a hard, deterministic wall, don't assume every schema push will fail without trying.
- Menu items have `rating_average`/`rating_count` (migration 20260731165248), owner-entered aggregates, real numbers pulled from wherever the owner's actual reviews already live, never fabricated by the app. This is deliberately not a customer review-submission system: the project has no accounts or auth at all, and RLS is strict "anonymous select only" everywhere, so public review writes would need their own auth/abuse-prevention design that hasn't been scoped. The card's star row only renders when `rating_count > 0`; as of this migration every item is 0, so no card shows a rating yet, that's correct, not a bug, until the owner enters real numbers via the dashboard.
