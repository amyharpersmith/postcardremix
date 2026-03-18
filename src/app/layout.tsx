import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Postcard Remix",
  description: "Create and share a music + GIF postcard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <div className="min-h-dvh">
          <header className="border-b border-black/10 dark:border-white/15">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
              <a href="/" className="font-semibold tracking-tight">
                Postcard Remix
              </a>
              <nav className="flex items-center gap-3 text-sm">
                <a
                  href="/create"
                  className="rounded-full bg-foreground px-4 py-2 font-medium text-background hover:opacity-90"
                >
                  Create
                </a>
              </nav>
            </div>
          </header>
          <main className="mx-auto w-full max-w-5xl px-4 py-10">{children}</main>
          <footer className="mx-auto w-full max-w-5xl px-4 pb-10 text-xs text-black/60 dark:text-white/60">
            Built for sharing. Cards may expire.
          </footer>
        </div>
      </body>
    </html>
  );
}
