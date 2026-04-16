import type { Metadata } from "next";
import { JetBrains_Mono, Press_Start_2P, VT323, Caveat } from "next/font/google";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const pressStart = Press_Start_2P({
  variable: "--font-press-start",
  subsets: ["latin"],
  weight: "400",
});

const vt323 = VT323({
  variable: "--font-vt323",
  subsets: ["latin"],
  weight: "400",
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["500", "700"],
});

export const metadata: Metadata = {
  title: "Postcard Remix — 80s Mixtape",
  description: "Make a neon music postcard. Pick a song, a GIF, a note. Share a short link.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${jetbrainsMono.variable} ${pressStart.variable} ${vt323.variable} ${caveat.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
