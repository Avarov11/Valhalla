# Valhalla: full redesign brief

Replaces the design sections of the previous brief. Everything about data, schema, security and the order flow still stands.

---

Redesign the entire visual and structural language of this site. Not adjustments. A different site that happens to serve the same menu.

Work in one pass. No comparison pages, no review routes, no approval gates, no "show me first". Build all of it, then show me the finished site. I will judge the result. Every previous round ended in a proposal that got deleted, and two days of work looks like none.

Create a branch before you start.

## Do not touch

Supabase schema, RLS, advisors, storage, the seed pipeline, `menu.json`, the WhatsApp order flow, the price-or-sizes constraint, the `is_available` behaviour. All finished. Any change there is out of scope.

## The thesis

The best restaurant sites of the last two years invert the old playbook. They use type and graphic form for the emotional work, and reserve photography for the moments that convert, which on this site means the menu card and the item detail page. Nothing else.

This matters here specifically. The photography is the weakest asset in the project. It has a template background baked in, the quality is uneven across 125 files, nine items share a photo, and every round so far has been spent compensating for it. Stop compensating. Build the hero, the section transitions and the footer out of typography, colour and form. The food appears where somebody is deciding what to order.

Second: the cafe is called Valhalla and no one has ever designed into that. It has been a pink template with a Norse name attached. Warm dark hall, charcoal and brass, warmth and shadow and heat, with pink running through it as the brand's own colour rather than a template's leftover. Restrained, not costume. No runes, no dragons, no fantasy lettering, no horned helmets. The feeling of a warm room on a dark street, not a theme park. Pink against warm charcoal is a genuinely good pairing and almost nobody in this category uses it, which is the point.

## Category defaults, all banned

These are what every cafe site does. If the result contains any of them, it has failed:

- Full-bleed hero food photo with a dark overlay and centred white text
- Script or handwritten display type
- Wood grain, kraft paper, chalkboard, burlap, or any texture pretending to be a physical menu
- An "Our Story" section, particularly one you would have to invent
- Parallax on a food photograph
- The delivery-app card: rounded rectangle, photo on top, name, description, price and a small button in a row underneath
- A hamburger menu holding anything that matters
- Centred hero text as the default composition
- Steam, sparkle, or bounce animation on anything

## Palette and type

Warm dark ground, pink accent. Specifically:

The product photos all carry the same pale pink panel, roughly `#ea87b7`, at the same crop with the same white wave. That is currently a template artefact. Treat it as a designed element instead. It is the one thing consistent across all 134 items, and consistency at that scale is worth more than the taste objection to the colour. Align the card around that panel, crop it deliberately, and let it be the photo plane.

Do not key the pink out. That instruction is withdrawn.

The accent is therefore also pink, or it will fight the panel. But not the same pink. The photo pink is pale and desaturated, so an accent in the same tone disappears into the card. Use a deep saturated rose, near `#BE185D`, which gives one hue family at two clearly separated values. The old site's theme colour turns out to be usable, for a different reason than it was picked.

Ember is dropped. The fire-lit warmth stays in the neutrals: warm charcoal ground, brass-tinted greys, real depth in the shadows. Warm neutrals are not a second accent.

The logo is pure black ink, so it composites onto anything and needs no second asset.

Prove three things and adjust if any fails:
- The deep rose add button against the pale pink panel it sits on. Needs obvious separation at 390px, not just technical contrast.
- Rose against the red and pink drinks: red velvet, strawberry mojito, blue curacao. If it muddies, shift the accent value rather than the hue.
- Rose in light mode at body size. Warm mid-tones usually pass 3:1 for large text and fail 4.5:1 for body. Define a darker light-mode variant now if needed.

Before anything else: grep for hardcoded hex values and named Tailwind colour classes outside `globals.css`. If components hardcode colours, the palette never reached them, which may be the entire reason nothing has looked different so far. Fix that first and tell me what you found.

Type carries the site now, so it has to be worth looking at. Reconsider both faces from scratch rather than inheriting the current pairing. The display face needs real character at very large sizes, because it is doing the work the hero photo used to do. Keep the Arabic face for the bilingual strings.

Set a scale with genuine range. If the largest thing on the page is 48px, the type is not carrying anything.

## Surfaces

**Hero.** No food photograph. Type, colour and form. Whatever composition earns the space, but not centred and not a photo with text on top. Still four text elements maximum, two-line headline maximum, subtext under twenty words, both CTAs visible without scrolling at 390px and at 1024px.

**Menu.** This is the site. 15 categories, 134 items, and someone standing outside the shop deciding. Scannability wins over cleverness here, but the current grid is a spreadsheet and the card is a delivery-app default. Redesign both. Consider whether every category should be presented identically, given that Sweet Cones has 10 items and Extras has 13 that are mostly toppings.

**Card.** Redesign completely. Weight through scale and depth, never through stacked borders plus shadows plus gradients plus glow. Description drops from the grid card, since the detail page holds it. Price should be a typographic event, not small grey text.

The pink panel stays. Design the card around it rather than against it. Decide deliberately how it meets the card edge, whether it bleeds, and what happens to the white wave at its bottom, which is the ugliest part of the template and the part most worth taking control of. Crop consistently across all 134 so the panel reads as a designed frame rather than an inherited background.

Test every card design against the weak photography, not the good shots. Omelette, Cheddar Sauce, Green Salad. A card that only works with the Kinder cone fails a hundred times on this menu.

Handle both hard cases: the 16 sized items with two prices each, and `is_available` false, which reads as sold out rather than broken and is genuinely disabled rather than just dimmed.

**Item detail.** Does not exist yet. Build it. Large photo, description, size selection, quantity, add to cart. Deep-linkable by URL so he can drop a single item into a WhatsApp conversation.

**Cart.** Bottom sheet on phone and tablet. Not a desktop drawer squeezed narrow. Reachable and dismissible one-handed.

**Footer.** Contact, the three real socials, the map, the tax note in both languages. Same design language as the hero so the two bookends belong together.

## Devices, and this is the priority

Phone, tablet and iPad are the audience. Desktop is the afterthought, not the reverse.

Four designed breakpoints: 390, 768, 1024, 1440. Designed, not merely unbroken. Verify with real categories, not three demo items. Sweet Cones has 10, Savory 11, Extras 13.

**Reachability.** Around half of phone users hold the device one-handed, and the comfortable arc is the bottom centre of the screen. The top corners are the hardest place to reach, and that is exactly where cart and search sit today. Move the core actions into a persistent bottom bar on phone and tablet: menu, search, cart. Keep the top bar for the wordmark and low-frequency controls like theme.

**Tablet is not a big phone.** At 1024 landscape it is a two-handed, two-thumb device. A persistent left rail for categories with the grid beside it is a real tablet layout. A stretched phone column is not. 768 portrait is its own case again, and nobody has looked at either yet.

**Touch.** Minimum 44px on every interactive element, with real spacing between them. Nothing important behind hover. Every hover affordance needs a touch equivalent. Test that the bottom sheet and the bottom bar do not collide with iOS safe areas.

## Motion

Intensity 5. Reveals on scroll and feedback on interaction. No GSAP, no ScrollTrigger, no pinning, no scroll hijack, no marquee. `prefers-reduced-motion` collapses everything, handled through `MotionConfig reducedMotion="user"` rather than branching render output.

Every animation justifiable in one sentence. Drop the rest.

## Still non-negotiable

One accent. One radius system. One theme across the page, light and dark both designed. Zero em-dash characters anywhere a user can see. Real alt text. Visible focus rings. No nested interactive elements. Reserve image dimensions. No invented facts about the business: no hours, no neighbourhood, no founding year, no awards.

## When done

Update `CLAUDE.md` with the new direction. Tell me what you changed, what you deleted, and give me one command to run it. Then I look.
