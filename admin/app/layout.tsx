import type { Metadata } from "next";
import { Bricolage_Grotesque, Public_Sans } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Valhalla Admin",
  description: "Valhalla menu management.",
  robots: { index: false, follow: false },
};

/**
 * A true root layout now, unlike app/admin/layout.tsx in the main
 * project (which nested inside that project's own root layout). No
 * manual dark-mode toggle script here: admin has no theme-toggle
 * button anywhere, only `prefers-color-scheme` applies (see
 * globals.css), so there's nothing for a stored-preference script to
 * read yet. Add one if a toggle control is ever built.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bricolage.variable} ${publicSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
