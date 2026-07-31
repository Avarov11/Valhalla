import type { Metadata } from "next";
import { Bricolage_Grotesque, Public_Sans, Cairo } from "next/font/google";
import { LazyMotion, domMax, MotionConfig } from "motion/react";
import { getMenu } from "@/lib/menu/get-menu";
import { CartProvider } from "@/lib/cart/cart-context";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-public-sans",
  display: "swap",
});

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
});

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Valhalla - Hall of Chimney Cakes",
  description:
    "Valhalla chimney cake cafe and restaurant. Browse the menu and order on WhatsApp.",
};

/**
 * Fetches the menu once here (in addition to page.tsx's own fetch for the
 * grid) so the cart context can be provided above both `children` and the
 * `modal` parallel slot. Item detail is a real route now
 * (app/item/[id], intercepted from within the app via app/@modal), which
 * put "add to cart" in a subtree that shares no client ancestor with the
 * main page's grid unless the provider sits up here, at the root.
 *
 * LazyMotion wraps the whole tree so every component below imports the
 * lightweight `m` component instead of the full `motion` component,
 * which bundles every animation feature unconditionally. `domMax`, not
 * the smaller `domAnimation`, because CategoryRail and CategorySidebar's
 * sliding active-pill indicator uses `layoutId`, and layout animations
 * are only in the max feature set, not the animation-only one. `strict`
 * throws if any component under this tree still imports `motion`
 * instead of `m`, catching a missed conversion instead of silently
 * losing the size win.
 */
export default async function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  const menu = await getMenu();

  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${publicSans.variable} ${cairo.variable}`}
      // The inline script below sets data-theme on this element directly,
      // before hydration, to avoid a flash of the wrong theme. The server
      // never renders that attribute (it has no access to localStorage),
      // so React sees a mismatch on this one element and warns. This is
      // the standard, narrow fix (same one next-themes uses): it only
      // silences the attribute-mismatch warning on <html> itself, not
      // hydration checks anywhere else in the tree.
      suppressHydrationWarning
    >
      <body>
        {/* Applies a stored manual theme choice before paint, so there is no
            flash of the wrong theme. Static content only, no interpolation. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('valhalla-theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`,
          }}
        />
        <LazyMotion features={domMax} strict>
          <MotionConfig reducedMotion="user">
            <CartProvider menu={menu}>
              {children}
              {modal}
            </CartProvider>
          </MotionConfig>
        </LazyMotion>
      </body>
    </html>
  );
}
