import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "A Mixtape for you",
  description: "A neon mixtape postcard, made just for you.",
  openGraph: {
    title: "A Mixtape for you",
    description: "A neon mixtape postcard, made just for you.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "A Mixtape for you",
    description: "A neon mixtape postcard, made just for you.",
  },
};

export default function CardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
