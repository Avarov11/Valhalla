import type { Metadata } from "next";
import { Outfit, Plus_Jakarta_Sans, Cairo } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans",
  display: "swap",
});

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Valhalla - Hall of Chimney Cakes",
  description:
    "Valhalla chimney cake cafe and restaurant. Browse the menu and order on WhatsApp.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${plusJakartaSans.variable} ${cairo.variable}`}
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
        {children}
      </body>
    </html>
  );
}
