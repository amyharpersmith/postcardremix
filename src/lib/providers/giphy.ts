function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

export type GiphyGifResult = { url: string; preview: string; alt: string };

function isGiphyGifResult(x: GiphyGifResult | null): x is GiphyGifResult {
  return x !== null;
}

export async function searchGiphy(q: string, limit = 24): Promise<GiphyGifResult[]> {
  const apiKey = requireEnv("GIPHY_API_KEY");

  const url = new URL("https://api.giphy.com/v1/gifs/search");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("q", q);
  url.searchParams.set("limit", String(Math.min(Math.max(limit, 1), 50)));
  url.searchParams.set("rating", "pg-13");

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GIPHY search failed (${res.status}): ${text || res.statusText}`);
  }

  const json = (await res.json()) as any;
  const items: any[] = json?.data ?? [];

  return items
    .map((g) => {
      const original = g?.images?.original?.url ? String(g.images.original.url) : "";
      const preview =
        g?.images?.fixed_width_small?.url ??
        g?.images?.fixed_height_small?.url ??
        g?.images?.preview_gif?.url ??
        g?.images?.downsized_small?.mp4;
      const title = String(g?.title ?? "GIF");
      if (!original || !preview) return null;
      return { url: original, preview: String(preview), alt: title };
    })
    .filter(isGiphyGifResult);
}

