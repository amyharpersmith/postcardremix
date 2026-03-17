function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

export type YouTubeVideoResult = {
  provider: "youtube";
  id: string;
  title: string;
  subtitle: string;
  url: string;
  embedUrl: string;
  thumbnailUrl?: string;
};

export async function searchYouTubeVideos(q: string, limit = 10): Promise<YouTubeVideoResult[]> {
  const key = requireEnv("YOUTUBE_API_KEY");

  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
  url.searchParams.set("maxResults", String(Math.min(Math.max(limit, 1), 25)));
  url.searchParams.set("q", q);
  url.searchParams.set("key", key);

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`YouTube search failed (${res.status}): ${text || res.statusText}`);
  }
  const json = (await res.json()) as any;
  const items: any[] = json?.items ?? [];

  const results: YouTubeVideoResult[] = [];
  for (const it of items) {
    const id = String(it?.id?.videoId ?? "");
    const sn = it?.snippet;
    const title = String(sn?.title ?? "");
    const channelTitle = String(sn?.channelTitle ?? "");
    const thumbnailUrl =
      sn?.thumbnails?.medium?.url ??
      sn?.thumbnails?.high?.url ??
      sn?.thumbnails?.default?.url;
    if (!id || !title) continue;

    results.push({
      provider: "youtube",
      id,
      title,
      subtitle: channelTitle,
      url: `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`,
      embedUrl: `https://www.youtube.com/embed/${encodeURIComponent(id)}`,
      ...(thumbnailUrl ? { thumbnailUrl: String(thumbnailUrl) } : {}),
    });
  }
  return results;
}

