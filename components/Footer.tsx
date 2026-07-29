import {
  FacebookLogo,
  InstagramLogo,
  MapPin,
  Phone,
  TiktokLogo,
  WhatsappLogo,
} from "@phosphor-icons/react/ssr";

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
 */
export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-(--border-default) bg-(--bg-page)">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-[0.22em] -left-[0.1em] select-none font-(family-name:--font-display) text-[34vw] font-bold leading-none tracking-(--tracking-tighter) text-(--border-default) lg:text-[20vw]"
      >
        VALHALLA
      </span>

      <div className="relative z-10 mx-auto max-w-(--page-max-width) px-4 pt-12 lg:px-10 lg:pt-16">
        <p className="font-(family-name:--font-display) text-(length:--text-display-sm) leading-(--leading-tight) tracking-(--tracking-tight) text-(--text-primary)">
          Hall of Chimney Cakes
        </p>
      </div>

      <div className="mx-auto grid max-w-(--page-max-width) gap-10 px-4 pb-12 pt-8 lg:grid-cols-[3fr_2fr] lg:px-10 lg:pb-16 lg:pt-10">
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
                className="flex h-11 w-11 items-center justify-center rounded-(--radius-pill) border border-(--border-default) text-(--text-secondary) transition duration-(--duration-fast) hover:bg-(--bg-surface-hover) active:scale-90"
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
