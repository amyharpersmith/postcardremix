type SpotifyToken = { access_token: string; expires_in: number; token_type: string };

let tokenCache:
  | {
      accessToken: string;
      expiresAtMs: number;
    }
  | undefined;

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAtMs > now + 10_000) return tokenCache.accessToken;

  const clientId = requireEnv("SPOTIFY_CLIENT_ID");
  const clientSecret = requireEnv("SPOTIFY_CLIENT_SECRET");
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      authorization: `Basic ${basic}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Spotify token failed (${res.status}): ${text || res.statusText}`);
  }

  const json = (await res.json()) as SpotifyToken;
  tokenCache = {
    accessToken: json.access_token,
    expiresAtMs: Date.now() + json.expires_in * 1000,
  };
  return json.access_token;
}

export type SpotifyTrackResult = {
  provider: "spotify";
  id: string;
  title: string;
  subtitle: string;
  url: string;
  embedUrl: string;
  thumbnailUrl?: string;
};

export async function searchSpotifyTracks(q: string, limit = 10): Promise<SpotifyTrackResult[]> {
  const accessToken = await getAccessToken();

  const url = new URL("https://api.spotify.com/v1/search");
  url.searchParams.set("type", "track");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("q", q);

  const res = await fetch(url, {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Spotify search failed (${res.status}): ${text || res.statusText}`);
  }
  const json = (await res.json()) as any;
  const items: any[] = json?.tracks?.items ?? [];

  const results: SpotifyTrackResult[] = [];
  for (const t of items) {
    const id = String(t?.id ?? "");
    const title = String(t?.name ?? "");
    const artists = Array.isArray(t?.artists)
      ? t.artists.map((a: any) => a?.name).filter(Boolean).join(", ")
      : "";
    const album = String(t?.album?.name ?? "");
    const url = String(t?.external_urls?.spotify ?? "");
    const thumbnailUrl = t?.album?.images?.[0]?.url ? String(t.album.images[0].url) : undefined;
    if (!id || !title || !url) continue;

    results.push({
      provider: "spotify",
      id,
      title,
      subtitle: [artists, album].filter(Boolean).join(" · "),
      url,
      embedUrl: `https://open.spotify.com/embed/track/${encodeURIComponent(id)}`,
      ...(thumbnailUrl ? { thumbnailUrl } : {}),
    });
  }
  return results;
}

