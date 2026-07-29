# Claude Code prompt: Valhalla chimney cafe menu site

Paste everything below the line into Claude Code, with `menu.json` sitting in the project root.

---

I am rebuilding the menu site for Valhalla, a chimney cake cafe and restaurant in Egypt. The owner is a friend of mine. His previous developer never handed over the source code, so we are rebuilding it from scratch. The old site is live at valhallachimney.com and I have already extracted its full catalogue into `menu.json` in this repo. The new site has to be clearly better than the old one, not a reskin.

## Status

This is the original brief. Steps 1 to 3 are **done**: tokens signed off, Supabase project created and linked, schema and RLS and storage applied, 15 categories and 134 items and 32 item_sizes seeded, all 134 images converted to WebP and uploaded, advisors clean. Next.js is scaffolded. Step 4 is the current work.

`CLAUDE.md` at the project root is authoritative. Where this file disagrees with it, follow `CLAUDE.md`. Read the migrations for the schema as built rather than the sketch below, which is the original proposal and not exactly what shipped.

## Setup first

Install and load this skill before you write any code, then follow it:

```bash
npx skills add Leonxlnx/taste-skill
```

Use the `taste-skill` / `design-taste-frontend` skill for the marketing surfaces (hero, brand sections, footer) and its Section 14 pre-flight check as the gate before you tell me you are done. The menu grid itself is a catalogue, so apply the skill's typography, colour, motion and copy rules there, but do not force landing-page composition tricks onto a list of 134 products that people need to scan quickly.

## Design read (already decided, do not re-derive)

Reading this as: a menu and ordering page for a neighbourhood chimney cake cafe in Egypt, mobile first for walk-in and delivery customers, with a warm dark hospitality language, leaning toward CSS custom-property tokens plus a characterful sans display and restrained scroll motion.

Dials: `DESIGN_VARIANCE: 6`, `MOTION_INTENSITY: 5`, `VISUAL_DENSITY: 5`. Variance and motion sit below the landing-page baseline on purpose. A menu that is hard to scan is a broken menu.

Redesign mode: **preserve**. Keep the brand, the content, and the information architecture. Modernise the execution.

## Brand facts (all real, in `menu.json`, do not invent more)

- Name: Valhalla, tagline "Hall of Chimney Cakes"
- Existing brand colour: `#BE185D`. Refine it into one deep rose accent and lock it across the whole page. No second accent anywhere.
- Phone `01000100115`, WhatsApp `201000100115`, Instagram `valhalla_chimney`, Facebook `ValhallaChimney`, TikTok `@Valhallaeg`
- Google Maps place: "Valhalla - Chimney Cafe & Restaurant" at `30.1052087, 31.3769701`
- Tax note that must appear near prices: "Prices include taxes" / "السعر شامل القيمة المضافة"

Do not invent opening hours, delivery zones, neighbourhood names, founding years, review counts, chef names, or awards. If a section wants that content, leave a clearly commented TODO and tell me at the end.

## The data

`menu.json` holds 15 categories and 134 items. Notes on it:

- Items are either single price (`price`) or two sizes (`sizes`, an object of label to price). Pizza is Medium and Large, some hot coffee is Single and Double. Build one card component that handles both.
- `imagePath` is relative to `brand.imageHost`. Paths contain spaces and parentheses, so encode each path segment.
- Every category has `en` and `ar` names. Item names and descriptions are English only for now.
- `emptyOnLiveSite` lists five categories the old site advertises in its nav but renders empty: New Items, Offers, Custom Cone Build, Custom Classic Build, Sundae. Leave commented placeholders for these and ask me about them at the end. The two "Custom Build" ones look like an interactive cone builder that was never finished, which is the single biggest feature opportunity here.
- `menu.json` is the **seed file**, not the runtime source. It gets loaded into Supabase once and then the database is the source of truth. Keep the file in the repo as the seed and as a rollback. Never hardcode a price or an item name into a component.

## Supabase

Connect the Supabase MCP server in Claude Code, or use the Supabase CLI with a personal access token.

The project already exists and is linked, in `eu-west-1`. Do not create another one and do not recreate this one over region. Apply all schema changes as migrations checked into the repo, never as ad-hoc SQL, and never by editing a migration that has already been applied.

Schema:

```
categories
  id            uuid pk default gen_random_uuid()
  slug          text unique not null
  name_en       text not null
  name_ar       text not null
  blurb         text
  sort_order    int  not null default 0
  is_active     bool not null default true

menu_items
  id            uuid pk default gen_random_uuid()
  category_id   uuid not null references categories(id) on delete cascade
  name_en       text not null
  name_ar       text
  description   text
  price         numeric(10,2)          -- null when the item has sizes
  is_popular    bool not null default false
  is_available  bool not null default true
  image_url     text
  sort_order    int  not null default 0

item_sizes
  id            uuid pk default gen_random_uuid()
  item_id       uuid not null references menu_items(id) on delete cascade
  label         text not null          -- Medium, Large, Single, Double
  price         numeric(10,2) not null
  sort_order    int  not null default 0
```

Constraint worth adding: an item has either a `price` or at least one row in `item_sizes`, never both and never neither. Enforce it however you think is cleanest and explain the choice.

`is_available` matters more than it looks. When the cafe runs out of pistachio at 9pm, the owner flips one toggle and the item greys out on the site instead of taking orders he cannot fill. Build the front end to respect it: available false renders the card dimmed with the add button disabled, not hidden.

**RLS, and be strict about this.** Enable RLS on all three tables. Anonymous gets `select` and nothing else. `categories` is gated on `is_active`. `menu_items` and `item_sizes` are **not** gated on `is_available`, because unavailable items must still reach the front end to render dimmed. No anonymous insert, update, or delete anywhere. Writes happen through the Supabase dashboard with the owner's own login. The `service_role` key must never appear in a client component, in `NEXT_PUBLIC_` anything, or in the repo. Only `NEXT_PUBLIC_SUPABASE_URL` and the publishable key go in the client. Add `.env.local` to `.gitignore` and commit a `.env.example` with empty values.

**Storage.** One public bucket, `menu-images`, structured as `menu-images/<category-slug>/<item-slug>.webp`. Public read policy, no anonymous write. Uploads happen from the seed script with a service role key held locally, and afterwards from the dashboard by the owner.

**Seeding.** One idempotent script, `npm run seed`, that reads `menu.json` and upserts on `slug` for categories and on a `category_slug + name_en` pair for items. Running it twice must not duplicate anything. Make it safe to re-run after the owner has already edited prices, meaning it should not clobber existing rows by default. Add a `--force` flag for a full reset.

**Reads.** Fetch in server components with the anon client, cached, `revalidate` around 60 seconds so the owner sees his edits within a minute. Do not fetch the menu client side. The whole catalogue is one query with two joins, so fetch it once at the page level and pass it down.

**Advisors.** Run `get_advisors` for both security and performance once the schema is in, and fix everything it flags before you tell me you are done.

## Images

Every product photo is a real photo of the real product on the current host. Write a Node script that reads `menu.json`, downloads every unique `imagePath` to a temp folder, converts it to WebP at a sensible max width with `sharp`, uploads it to Supabase Storage, and writes the resulting public URL back to the matching row. Deduplicate, since several items reuse the same file. Do not ship hotlinking to the old host, and do not commit the originals to the repo.

Some current files are 3840px wide, which is a large part of why the old site feels slow. Serve through `next/image` with the Supabase storage hostname added to `images.remotePatterns` in `next.config.ts`.

Note that a handful of items share a photo (Turkey Salami reuses the Salami shot, Cheddar Cheese reuses the Cheddar Sauce shot, Greek Salad reuses the Green Salad shot, several frappes share one). Flag the list at the end so my friend can shoot the missing ones.

## Stack

- Next.js App Router, TypeScript, Tailwind v4, Motion (`motion/react`)
- `next/font` for fonts. No `<link>` to Google Fonts.
- Icons from `@phosphor-icons/react` only. No hand-rolled SVG icon paths.
- Fonts: a characterful sans for display and a clean sans for body. Not Inter as the default, not a serif. Include an Arabic face for the Arabic strings.
- Supabase for the menu data and the product photos, `@supabase/supabase-js` on the server side only
- Deploys to Vercel. Statically generated with ISR, so the pages stay fast and the owner's edits still show up.

## What the site has to do

1. **Hero.** Asymmetric split, not centred. Real product photography, not a gradient blob. Max 4 text elements, headline at most 2 lines, subtext at most 20 words, CTAs visible without scrolling. One primary CTA and one secondary.
2. **Menu browsing.** Sticky category rail with scroll spy under a single-line header no taller than 80px. Category names show English with the Arabic underneath or beside it.
3. **Search.** Filters across item names and descriptions, with a real designed empty state.
4. **Cart and WhatsApp checkout.** Add to cart with quantity and size selection, running total, then a single "Order on WhatsApp" action that opens `wa.me/201000100115` with a formatted order in the message body. Use that exact label everywhere on the page, including the hero secondary CTA. This is how the cafe already takes orders. Persist the cart in `localStorage`.
5. **Bilingual labels.** English and Arabic for category names, cart UI, and the tax note. Full RTL is not required for v1, but do not paint yourself into a corner.
6. **Light and dark.** Token-based, both modes fully designed, defaults to `prefers-color-scheme`, manual toggle available. One theme across the whole page. No section flips.
7. **Footer.** Contact, socials, the embedded map, and the tax note.

## Non-negotiables

- Zero em-dash characters anywhere the user can see. Headlines, body, buttons, alt text, order messages. Use a regular hyphen.
- One accent colour, one corner-radius system, one theme, one neutral family. Document the radius rule in a comment and follow it.
- Every image has real alt text. Every interactive element is keyboard reachable with a visible focus ring.
- `prefers-reduced-motion` collapses all motion.
- Reserve image dimensions so CLS stays under 0.1. LCP under 2.5s on a mid-range Android over 4G, which is what most of these customers are on.
- Loading, empty and error states for the search and the cart, not just the happy path.
- No `window.addEventListener('scroll')`. Use IntersectionObserver or Motion's `useScroll`.
- Mobile is the primary target. Design it at 390px first, then scale up.

## Work in this order

1. ~~Tokens signed off.~~ Done.
2. ~~Supabase project, migrations, RLS, storage bucket.~~ Done.
3. ~~Seed script and image pipeline.~~ Done, counts verified against the database.
4. Card, category rail, search, cart. Menu page working end to end against real Supabase data. **Current step.**
5. Hero, footer, motion layer.
6. Run `get_advisors` for security and performance, then run the skill's Section 14 pre-flight check line by line and paste both results. Then list every TODO, and the nine items still sharing a photo with another item so my friend has a shot list.

Ask me at most one question if something is genuinely ambiguous. Otherwise make the call and tell me what you decided.
