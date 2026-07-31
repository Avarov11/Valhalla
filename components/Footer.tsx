import Image from "next/image";
import { FacebookLogo } from "@phosphor-icons/react/dist/ssr/FacebookLogo";
import { InstagramLogo } from "@phosphor-icons/react/dist/ssr/InstagramLogo";
import { MapPin } from "@phosphor-icons/react/dist/ssr/MapPin";
import { Phone } from "@phosphor-icons/react/dist/ssr/Phone";
import { TiktokLogo } from "@phosphor-icons/react/dist/ssr/TiktokLogo";
import { WhatsappLogo } from "@phosphor-icons/react/dist/ssr/WhatsappLogo";
import valMark from "@/val.png";

const WHATSAPP_GREETING = "Hi Valhalla, I'd like to place an order.";
const WHATSAPP_URL = `https://wa.me/201000100115?text=${encodeURIComponent(WHATSAPP_GREETING)}`;
const MAP_LAT = 30.1052087;
const MAP_LNG = 31.3769701;
const MAP_PLACE = "Valhalla - Chimney Cafe & Restaurant";

// Google Maps' key-less "output=embed" iframe trick has been retired
// (it 404s now); embedding Google Maps for real requires a paid Maps
// Embed API key, which nobody has provided and this project won't
// fabricate. OpenStreetMap's embed is free, needs no key, and actually
// works, so it's what's embedded here. The "get directions" link below
// still points at Google Maps, since that's what most customers
// already have installed for turn-by-turn navigation.
const MAP_DELTA = 0.003;
const MAP_EMBED_URL = `https://www.openstreetmap.org/export/embed.html?bbox=${MAP_LNG - MAP_DELTA}%2C${MAP_LAT - MAP_DELTA}%2C${MAP_LNG + MAP_DELTA}%2C${MAP_LAT + MAP_DELTA}&marker=${MAP_LAT}%2C${MAP_LNG}`;

const socials = [
  { name: "Instagram", href: "https://www.instagram.com/valhalla_chimney", Icon: InstagramLogo },
  { name: "Facebook", href: "https://www.facebook.com/ValhallaChimney", Icon: FacebookLogo },
  { name: "TikTok", href: "https://www.tiktok.com/@Valhallaeg", Icon: TiktokLogo },
];

/**
 * Redesign (2026-07-29): the giant low-contrast background wordmark is
 * the same device Hero opens the page with, bleeding off the LEFT edge
 * here rather than the right, so the two bookends visually rhyme instead
 * of repeating identically. Asymmetric columns (3fr/2fr) and the map
 * panel pulled up over the content column via negative margin carry over
 * from the previous pass, both still fit the brief's "not centred" and
 * "overlap, not two clean rectangles" instincts.
 *
 * Both real-content blocks need `relative z-10` against the wordmark,
 * not just the first one (2026-07-31 fix): the wordmark is
 * `position: absolute` with no explicit z-index, and per CSS stacking
 * rules a positioned element at z-index:auto paints above unpositioned,
 * static in-flow content regardless of DOM order. The tagline block had
 * z-10 already; the contact/icons/map block didn't, so the wordmark was
 * rendering in front of it, muddying the social icons and tax note
 * against the giant letters behind them. The icon buttons additionally
 * get a solid `bg-(--bg-page)` fill, their border colour is the same
 * token as the wordmark's, so even correctly stacked on top, a
 * transparent circle would still show wordmark strokes bleeding through
 * its interior.
 *
 * EXPERIMENT (2026-07-31): wordmark is val.png (raster) instead of live
 * text, matching the same change in Hero.tsx, for the same reason: kept
 * consistent between the two bookends rather than leaving one on the
 * image and one on text. Same caveats as Hero.tsx: upscale softening
 * expected, --logo-invert plus opacity stands in for the themed
 * --border-default colour a text element could carry directly.
 *
 * Position (-bottom-[3vw] -left-[2vw]) is one rule for every
 * breakpoint, only width changes at lg (w-[130vw] lg:w-[76vw]),
 * matching exactly how the live-text version was built
 * (text-[34vw] lg:text-[20vw], same 1.7x ratio, same anchor point at
 * every size, per request after separate lg positioning attempts kept
 * missing). If this reads as too dominant on a very wide desktop, the
 * original text at that same width had the identical uncapped
 * scaling, this isn't a new problem the image introduced.
 */
export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-(--border-default) bg-(--bg-page)">
      <Image
        src={valMark}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-[3vw] -left-[2vw] w-[130vw] max-w-none select-none opacity-[0.16] [filter:var(--logo-invert)] lg:w-[76vw]"
      />

      <div className="relative z-10 mx-auto max-w-(--page-max-width) px-4 pt-12 lg:px-10 lg:pt-16">
        <p className="font-(family-name:--font-display) text-(length:--text-display-sm) leading-(--leading-tight) tracking-(--tracking-tight) text-(--text-primary)">
          Hall of Chimney Cakes
        </p>
      </div>

      <div className="relative z-10 mx-auto grid max-w-(--page-max-width) gap-10 px-4 pb-12 pt-8 lg:grid-cols-[3fr_2fr] lg:px-10 lg:pb-16 lg:pt-10">
        <div className="flex flex-col gap-4 lg:pr-10">
          <div className="flex flex-col gap-2">
            <a
              href="tel:+201000100115"
              className="flex min-h-11 w-fit items-center gap-2 text-(length:--text-sm) text-(--text-secondary) hover:text-(--text-primary)"
            >
              <Phone size={18} />
              01000100115
            </a>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 w-fit items-center gap-2 text-(length:--text-sm) text-(--text-secondary) hover:text-(--text-primary)"
            >
              <WhatsappLogo size={18} />
              Order on WhatsApp
            </a>
          </div>

          <div className="flex items-center gap-3">
            {socials.map(({ name, href, Icon }) => (
              <a
                key={name}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={name}
                className="flex h-11 w-11 items-center justify-center rounded-(--radius-pill) border border-(--border-default) bg-(--bg-page) text-(--text-secondary) transition duration-(--duration-fast) hover:bg-(--bg-surface-hover) active:scale-90"
              >
                <Icon size={18} />
              </a>
            ))}
          </div>

          <div className="pt-2 text-(length:--text-xs) text-(--text-muted)">
            <p>Prices include taxes</p>
            <p className="font-(family-name:--font-arabic)">السعر شامل القيمة المضافة</p>
          </div>

          {/* TODO: opening hours are not in menu.json. Ask for real hours before
              adding them here, do not invent them. */}
        </div>

        <div className="relative flex flex-col gap-2 lg:-mt-20">
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${MAP_LAT},${MAP_LNG}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-fit items-center gap-2 text-(length:--text-sm) text-(--text-secondary) hover:text-(--text-primary)"
          >
            <MapPin size={18} />
            {MAP_PLACE}
          </a>
          <div className="overflow-hidden rounded-(--radius-lg) border-4 border-(--bg-page) shadow-(--shadow-lg) ring-1 ring-(--border-default)">
            <iframe
              title="Valhalla location map"
              src={MAP_EMBED_URL}
              width="100%"
              height="280"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
