import { NextResponse } from "next/server";
import { searchSpotifyTracks } from "@/lib/providers/spotify";
import { rateLimitOrThrow } from "@/lib/rateLimit";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const query = q.trim();
  if (!query) return NextResponse.json({ results: [] });
  if (query.length > 200) return NextResponse.json({ error: "Query too long" }, { status: 400 });

  try {
    await rateLimitOrThrow({ req, name: "searchSpotify", limit: 60, windowSeconds: 60 });
    const results = await searchSpotifyTracks(query, 10);
    return NextResponse.json({ results });
  } catch (e) {
    if (e instanceof Error && e.message === "Rate limited") {
      return NextResponse.json({ error: "Rate limited" }, { status: 429 });
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Spotify search failed" },
      { status: 500 },
    );
  }
}

