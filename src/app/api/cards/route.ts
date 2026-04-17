import { NextResponse } from "next/server";
import { createCard, SlugTakenError } from "@/lib/storage/cards";
import { rateLimitOrThrow } from "@/lib/rateLimit";

const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])?$/;
const RESERVED_SLUGS = new Set(["api", "create", "c", "admin", "new", "about"]);

function validateCustomSlug(raw: unknown): string | null {
  if (raw == null || raw === "") return null;
  if (typeof raw !== "string") throw new Error("Invalid custom slug");
  const slug = raw.trim().toLowerCase();
  if (!slug) return null;
  if (!SLUG_PATTERN.test(slug)) {
    throw new Error("Slug must be 3-30 chars, lowercase letters, numbers, or hyphens");
  }
  if (RESERVED_SLUGS.has(slug)) throw new Error("That slug is reserved");
  return slug;
}

function getBaseUrl(req: Request): string {
  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

export async function POST(req: Request) {
  try {
    await rateLimitOrThrow({ req, name: "createCard", limit: 20, windowSeconds: 60 });
  } catch {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const body = (await req.json().catch(() => null)) as any;
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const toName = String(body.toName ?? "").trim();
  const message = String(body.message ?? "").trim();
  const caption = String(body.caption ?? "").trim();
  const song = body.song ?? null;
  const media = body.media ?? null;
  const playlistSongs = body.playlistSongs ?? null;

  if (!toName || !message || !song || !media) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (toName.length > 60) return NextResponse.json({ error: "Recipient name too long" }, { status: 400 });
  if (message.length > 280) return NextResponse.json({ error: "Message too long" }, { status: 400 });
  if (caption.length > 80) return NextResponse.json({ error: "Caption too long" }, { status: 400 });

  try {
    const provider = song.provider === "youtube" ? song.provider : null;
    if (!provider) return NextResponse.json({ error: "Invalid song provider" }, { status: 400 });

    const mediaType = media.type === "gif" || media.type === "image" ? media.type : null;
    if (!mediaType) return NextResponse.json({ error: "Invalid media type" }, { status: 400 });

    const songUrl = String(song.url ?? "");
    const embedUrl = String(song.embedUrl ?? "");
    if (!embedUrl) return NextResponse.json({ error: "Invalid embed URL" }, { status: 400 });

    // Validate embedUrl: either YouTube playlist, YouTube video, or custom playlist
    const isYouTubePlaylist = embedUrl.startsWith("https://www.youtube.com/embed/videoseries?list=");
    const isYouTubeVideo = embedUrl.startsWith("https://www.youtube.com/embed/");
    const isCustomPlaylist = embedUrl.startsWith("custom://playlist/");

    if (!isYouTubePlaylist && !isYouTubeVideo && !isCustomPlaylist) {
      return NextResponse.json({ error: "Invalid embed URL format" }, { status: 400 });
    }

    const mediaUrl = String(media.url ?? "");
    if (!mediaUrl.startsWith("https://")) {
      return NextResponse.json({ error: "Media URL must be https" }, { status: 400 });
    }

    let customSlug: string | null;
    try {
      customSlug = validateCustomSlug(body.customSlug);
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Invalid slug" },
        { status: 400 },
      );
    }

    const card = await createCard(
      {
        toName,
        message,
        caption: caption || undefined,
        song: {
          provider,
          title: String(song.title ?? ""),
          subtitle: String(song.subtitle ?? ""),
          url: songUrl,
          embedUrl,
          thumbnailUrl: song.thumbnailUrl ? String(song.thumbnailUrl) : undefined,
        },
        media: {
          type: mediaType,
          url: mediaUrl,
          alt: media.alt ? String(media.alt) : undefined,
        },
        playlistSongs: playlistSongs && Array.isArray(playlistSongs) ? playlistSongs : undefined,
      },
      customSlug ? { customSlug } : undefined,
    );

    const shareUrl = new URL(`/c/${encodeURIComponent(card.id)}`, getBaseUrl(req)).toString();
    return NextResponse.json({ id: card.id, shareUrl });
  } catch (e) {
    if (e instanceof SlugTakenError) {
      return NextResponse.json({ error: "That link is already taken — try another" }, { status: 409 });
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Create failed" },
      { status: 500 },
    );
  }
}

