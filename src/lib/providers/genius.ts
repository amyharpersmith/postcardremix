function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

export type GeniusTrackResult = {
  provider: "genius";
  id: string;
  title: string;
  subtitle: string;
  url: string;
  embedUrl: string;
  thumbnailUrl?: string;
};

export async function searchGeniusTracks(q: string, limit = 10): Promise<GeniusTrackResult[]> {
  const accessToken = requireEnv("GENIUS_ACCESS_TOKEN");

  const url = new URL("https://api.genius.com/search");
  url.searchParams.set("q", q);
  url.searchParams.set("per_page", String(limit));

  const res = await fetch(url, {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  
  const text = await res.text();
  console.log("[Genius API]", res.status, text.substring(0, 200));
  
  if (!res.ok) {
    throw new Error(`Genius search failed (${res.status}): ${text || res.statusText}`);
  }
  
  const json = JSON.parse(text) as any;
  const hits: any[] = json?.response?.hits ?? [];

  console.log("[Genius] Found", hits.length, "hits for query:", q);

  const results: GeniusTrackResult[] = [];
  for (const hit of hits) {
    const song = hit?.result;
    if (!song) continue;

    const id = String(song?.id ?? "");
    const title = String(song?.title ?? "");
    const artist = String(song?.primary_artist?.name ?? "");
    const url = String(song?.url ?? "");
    const thumbnailUrl = song?.song_art_image_thumbnail_url ? String(song.song_art_image_thumbnail_url) : undefined;
    
    if (!id || !title || !url) continue;

    results.push({
      provider: "genius",
      id,
      title,
      subtitle: artist,
      url,
      embedUrl: `${url}?utm_source=postcardremix`,
      ...(thumbnailUrl ? { thumbnailUrl } : {}),
    });
  }
  
  console.log("[Genius] Returning", results.length, "results");
  return results;
}

