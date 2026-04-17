import { kv } from "@vercel/kv";
import { newCardId } from "@/lib/ids";

export type CardSong = {
  provider: "youtube";
  title: string;
  subtitle: string;
  url: string;
  embedUrl: string;
  thumbnailUrl?: string;
};

export type PlaylistSong = {
  id: string;
  title: string;
  subtitle: string;
  videoId: string;
  thumbnailUrl?: string;
};

export type CardMedia = {
  type: "gif" | "image";
  url: string;
  alt?: string;
};

export type Card = {
  id: string;
  version: 1;
  createdAt: string;
  toName: string;
  message: string;
  caption?: string;
  song: CardSong;
  media: CardMedia;
  playlistSongs?: PlaylistSong[];
};

const KEY_PREFIX = "card:";
const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 90;

function ttlSeconds(): number {
  const raw = process.env.CARD_TTL_SECONDS;
  if (!raw) return DEFAULT_TTL_SECONDS;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_TTL_SECONDS;
  return Math.floor(n);
}

function keyFor(id: string) {
  return `${KEY_PREFIX}${id}`;
}

export async function createCard(input: Omit<Card, "id" | "version" | "createdAt">): Promise<Card> {
  const card: Card = {
    ...input,
    id: newCardId(),
    version: 1,
    createdAt: new Date().toISOString(),
  };
  await kv.set(keyFor(card.id), card, { ex: ttlSeconds() });
  return card;
}

export async function getCard(id: string): Promise<Card | null> {
  const card = await kv.get<Card>(keyFor(id));
  return card ?? null;
}

