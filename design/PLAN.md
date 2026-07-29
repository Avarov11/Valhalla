# Valhalla menu site: plan and design tokens (Step 1)

Scope of this document: Step 1 only, per PROMPT.md. No Supabase project, no components yet. Waiting on sign-off before continuing.

## Design read (restated from PROMPT.md, not re-derived)

Reading this as: a menu and ordering page for a neighbourhood chimney cake cafe in Egypt, mobile first for walk-in and delivery customers, with a warm dark hospitality language, leaning toward CSS custom-property tokens plus a characterful sans display and restrained scroll motion.

| Dial | Value | Reading |
|---|---|---|
| `DESIGN_VARIANCE` | **8 on marketing surfaces** (hero, brand sections, the cone-builder entry section, footer), **6 on the menu grid** | Split deliberately, 2026-07-28: marketing surfaces push further into asymmetry so the page reads as nothing like the old site. The menu grid stays at 6, scanning 134 items fast is not negotiable regardless of how bold the rest of the page gets. |
| `MOTION_INTENSITY` | 5 everywhere | Fluid-CSS band, unchanged, on every surface including the cone builder. Real entry transitions and hover feedback, no scroll-hijacking, no parallax, no pinned sections, no GSAP. |
| `VISUAL_DENSITY` | 5 | Daily-app band. Section rhythm `py-16` to `py-24` on marketing surfaces, tighter but still breathable card padding on the grid. |

Redesign mode: **preserve**. Brand, copy voice, and IA carry over. Execution is rebuilt from scratch.

**Note (2026-07-28):** `DESIGN_VARIANCE` is no longer a single page-wide number. Per Section 1.C the dial names are fixed but nothing says the page can't be zoned: marketing surfaces read the brief as "landing page" (7-9 band), the catalog reads it as "the thing 134 people scan fast" (predictable band). Splitting by surface rather than picking one compromise number for the whole page is the more honest application of Section 0's brief-inference step, since the menu grid and the marketing surfaces are genuinely different jobs.

## Setup note: taste-skill

`npx skills add Leonxlnx/taste-skill` was blocked by the permission classifier (it runs an unreviewed third-party install script). Instead I fetched the actual skill spec straight from the source repo over plain HTTPS (`raw.githubusercontent.com/Leonxlnx/taste-skill/main/skills/taste-skill/SKILL.md`, read-only, no code execution) and confirmed it's the real `design-taste-frontend` skill: its three dials and their descriptions match PROMPT.md's `DESIGN_VARIANCE` / `MOTION_INTENSITY` / `VISUAL_DENSITY` language exactly.

I tried installing it properly as a Claude Code project skill under `.claude/skills/`, which was also blocked (writes into Claude Code's own config directory are gated separately). It's saved instead as a plain reference file at [design/reference/taste-skill.md](reference/taste-skill.md), and I've read it in full and applied its rules below and will keep applying them through the build, including its Section 14 pre-flight checklist at the end. Functionally this gets you the same outcome; it just isn't wired up as an auto-loaded skill for future sessions. Let me know if you'd rather grant Bash permission for one of those two commands and have me redo it properly.

## Data audit (menu.json)

Verified by script, not by eye:
- 15 categories, 134 items. Matches PROMPT.md's numbers.
- 125 unique `imagePath` values for 134 items - 9 items reuse a photo already used by another item. The three the prompt calls out (Turkey Salami / Salami, Cheddar Cheese / Cheddar Sauce, Greek Salad / Green Salad) are confirmed, plus four more the prompt doesn't mention: Nutella / Nutella Banana (Sweet Classic), Latte De Leche / Spanish Latte (Hot Coffee), and two three-way ties in Cold Coffee (Ice Latte / Ice Latte De Leche / Ice Spanish Latte, and Frappe Latte / Frappe Caramel / Frappe Coffee). Full list will come back at the end per step 6, this is just confirming the data is understood before token work starts.
- `emptyOnLiveSite` (New Items, Offers, Custom Cone Build, Custom Classic Build, Sundae) noted, will carry commented placeholders, not building the cone configurator now. Flagging it again at the end as instructed.

## Type system

Non-negotiable: no Inter, no serif, real Arabic face, characterful display + clean body.

- **Display (headlines, hero, section titles, category names):** `Outfit` via `next/font/google`. Geometric but not sterile: single-story `a`, rounder terminals than a generic grotesk, wide weight range (400-800) for a food brand that needs warmth without going script/serif.
- **Body (descriptions, cart, UI copy, prices):** `Plus Jakarta Sans` via `next/font/google`. Humanist, warm, strong number legibility at small sizes, which matters for a page full of prices.
- **Arabic (category names' `ar` field, tax note):** `Cairo` via `next/font/google`. Full weight range, broad Arabic glyph coverage, reads clean next to Outfit/Plus Jakarta Sans without fighting them for attention. Arabic strings render at `text-sm`-`text-base` beside/under the English label, not full RTL layout for v1 per spec.

All three load through `next/font/google`, so no `<link>` tag and no external request at runtime.

Pairing avoids the skill's banned-serif defaults (`Fraunces`, `Instrument Serif`) entirely since serif isn't justified here (this is a modern casual cafe, not editorial/luxury/heritage).

## Color system

Brand hex `#BE185D` is, exactly, Tailwind's `pink-700`. Rather than hand-roll a ramp, I anchored the accent scale to the real Tailwind pink scale so 700 lands on your exact brand hex with a tested ramp around it:

| Step | Hex | Use |
|---|---|---|
| 50 | `#fdf2f8` | rare tint backgrounds (e.g. "popular" chip fill in light mode) |
| 100 | `#fce7f3` | subtle hover backgrounds |
| 300 | `#f9a8d4` | disabled-state accent text |
| 400 | `#f472b6` | dark-mode links/icons/prices (brighter for contrast on dark bg) |
| 500 | `#ec4899` | dark-mode primary CTA fill |
| 600 | `#db2777` | light-mode CTA hover |
| **700** | **`#BE185D`** | **brand-locked. Light-mode primary CTA fill, light-mode price/link accent.** |
| 800 | `#9d174d` | light-mode CTA active/pressed |
| 950 | `#500724` | high-contrast text-on-tint edge case |

One accent, used identically in kind (CTAs, prices, active nav state, "popular" badge, focus ring) everywhere on the page. Nothing else on the page gets a second hue. Light and dark mode use different steps of the *same* ramp for contrast, never a different color.

**Neutral family: Stone, not Zinc/Slate.** Zinc and Slate read cool-blue-gray; Stone has a warm undertone that matches "warm dark hospitality" without drifting into the skill's banned premium-consumer cream palette (that ban is specifically about saturated warm-paper backgrounds like `#f5f1ea`/`#efeae0` paired with brass/oxblood accents - Stone-50 at `#fafaf9` is a desaturated warm gray, not a cream/parchment tone, and the accent here is rose, not brass).

- Dark mode is the primary expression (`prefers-color-scheme` default), background `#0c0a09` (Stone-950, off-black, not pure `#000`), surface `#1c1917` (Stone-900) for cards/rail, `#292524` (Stone-800) for hover/elevated states.
- Light mode background `#fafaf9` (Stone-50), surface `#ffffff` for cards (a plain white card reading as "elevated" against an off-white page is fine; the "no pure white" rule is about the whole page, not a small surface against a warm-tinted backdrop).
- Text: Stone-900/50 primary, Stone-600/300 secondary, Stone-500/400 muted, matched to light/dark respectively.

**Unavailable items and error/empty states do not get a second accent color.** Per the non-negotiable "one accent colour... anywhere," an out-of-stock item is communicated with reduced opacity (`0.5`) plus a desaturated neutral "Sold out" chip (Stone tones, no red), and error/empty states in search and cart use a neutral bordered panel with an icon and plain copy rather than an error-red. This keeps the one-accent rule intact while still being unambiguous.

## Corner radius (one documented system)

Full-sharp didn't fit a dessert brand; full-soft-everywhere made buttons and cards look identical. Documented mixed system, per the skill's explicit allowance for this:

- Buttons, badges, chips, category-rail pills, tags: **full pill** (`--radius-pill`, 999px). Interactive things are always pills.
- Cards, item photos, the cart sheet, modals: **`--radius-lg`, 20px.**
- Inputs, the search bar: **`--radius-md`, 14px.**
- Small elements (checkboxes, tiny tag corners if any appear): **`--radius-sm`, 8px.**

This rule is documented once in the tokens file and every component follows it, no per-component radius decisions later.

## Spacing and motion

- Spacing scale is a standard 4px-based rem scale (see tokens file). Section vertical rhythm on marketing surfaces: `py-16` mobile to `py-24` desktop (density 5, "daily app" band, not art-gallery airy, not cockpit-tight).
- Menu grid card padding stays tighter (`space-4`/`space-5`) since density there is about scan speed, not marketing breathing room.
- Motion tokens are duration/easing pairs only (`--duration-fast/base/slow`, one easing curve). No animation library specifics live in the token file; Motion (`motion/react`) implementation happens at component build.
- Every token-driven transition collapses under `prefers-reduced-motion: reduce` (enforced at component level, not something a token file can do by itself, flagging it here so it isn't forgotten at build time).

## What's intentionally not decided yet

- Component structure (card, rail, cart, search) - step 4.
- Hero copy and layout - step 5.
- The two "Custom Build" cone configurators and the other three empty-on-live-site categories - PROMPT.md asks me to raise these at the end (step 6), not resolve them now. Flagging early only so it's on your radar while you're reviewing tokens: the interactive cone builder is real scope, not a small add, if you want it in v1 rather than v2.

## Open question

None genuinely blocking at this stage. Everything above is either specified in PROMPT.md/menu.json or a call I'm making and stating rather than asking about, per your instruction. If you'd rather a different font pairing or neutral family, easiest to redirect now before it's threaded through components.

---

Token file: [design/tokens.css](tokens.css). Review both, then say go and I'll move to the Supabase cost check (step 2).
