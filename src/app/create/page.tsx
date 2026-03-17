"use client";

import { useMemo, useState } from "react";

type SongProvider = "spotify" | "youtube";
type MediaType = "gif" | "image";

type SongResult = {
  provider: SongProvider;
  id: string;
  title: string;
  subtitle: string;
  url: string;
  embedUrl: string;
  thumbnailUrl?: string;
};

type Media = {
  type: MediaType;
  url: string;
  alt?: string;
};

type CreateCardRequest = {
  toName: string;
  message: string;
  song: Omit<SongResult, "id"> & { provider: SongProvider };
  media: Media;
};

export default function CreatePage() {
  const [songProvider, setSongProvider] = useState<SongProvider>("spotify");
  const [songQuery, setSongQuery] = useState("");
  const [songResults, setSongResults] = useState<SongResult[]>([]);
  const [songLoading, setSongLoading] = useState(false);
  const [selectedSong, setSelectedSong] = useState<SongResult | null>(null);

  const [gifQuery, setGifQuery] = useState("");
  const [gifResults, setGifResults] = useState<Array<{ url: string; preview: string; alt: string }>>([]);
  const [gifLoading, setGifLoading] = useState(false);

  const [media, setMedia] = useState<Media | null>(null);

  const [toName, setToName] = useState("");
  const [message, setMessage] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return Boolean(selectedSong && media && toName.trim() && message.trim());
  }, [selectedSong, media, toName, message]);

  async function searchSongs() {
    setError(null);
    setShareUrl(null);
    setSongLoading(true);
    try {
      const q = songQuery.trim();
      if (!q) {
        setSongResults([]);
        return;
      }
      const res = await fetch(`/api/search/${songProvider}?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Song search failed");
      setSongResults(json.results as SongResult[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Song search failed");
    } finally {
      setSongLoading(false);
    }
  }

  async function searchGifs() {
    setError(null);
    setShareUrl(null);
    setGifLoading(true);
    try {
      const q = gifQuery.trim();
      if (!q) {
        setGifResults([]);
        return;
      }
      const res = await fetch(`/api/search/giphy?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "GIF search failed");
      setGifResults(json.results as Array<{ url: string; preview: string; alt: string }>);
    } catch (e) {
      setError(e instanceof Error ? e.message : "GIF search failed");
    } finally {
      setGifLoading(false);
    }
  }

  async function onUpload(file: File) {
    setError(null);
    setShareUrl(null);
    try {
      const form = new FormData();
      form.set("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Upload failed");
      setMedia({ type: "image", url: json.url as string, alt: file.name });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    }
  }

  async function createCard() {
    if (!selectedSong || !media) return;
    setSubmitting(true);
    setError(null);
    setShareUrl(null);
    try {
      const body: CreateCardRequest = {
        toName: toName.trim(),
        message: message.trim(),
        song: {
          provider: selectedSong.provider,
          title: selectedSong.title,
          subtitle: selectedSong.subtitle,
          url: selectedSong.url,
          embedUrl: selectedSong.embedUrl,
          thumbnailUrl: selectedSong.thumbnailUrl,
        },
        media,
      };
      const res = await fetch("/api/cards", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Create failed");
      setShareUrl(json.shareUrl as string);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="grid gap-6">
        <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/15 dark:bg-black">
          <h2 className="text-lg font-semibold">Pick a song</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {(["spotify", "youtube"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setSongProvider(p);
                  setSongResults([]);
                  setSelectedSong(null);
                }}
                className={[
                  "rounded-full px-4 py-2 text-sm font-medium",
                  p === songProvider
                    ? "bg-foreground text-background"
                    : "border border-black/10 hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10",
                ].join(" ")}
              >
                {p === "spotify" ? "Spotify" : "YouTube"}
              </button>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <input
              value={songQuery}
              onChange={(e) => setSongQuery(e.target.value)}
              placeholder="Search by title, artist, or keywords…"
              className="h-11 w-full rounded-xl border border-black/10 bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-black/20 dark:border-white/15 dark:focus:ring-white/20"
            />
            <button
              type="button"
              onClick={searchSongs}
              disabled={songLoading}
              className="h-11 shrink-0 rounded-xl bg-foreground px-4 text-sm font-medium text-background hover:opacity-90 disabled:opacity-60"
            >
              {songLoading ? "Searching…" : "Search"}
            </button>
          </div>

          <div className="mt-4 grid gap-2">
            {songResults.map((r) => (
              <button
                key={`${r.provider}:${r.id}`}
                type="button"
                onClick={() => setSelectedSong(r)}
                className={[
                  "flex items-center gap-3 rounded-xl border px-3 py-2 text-left",
                  selectedSong?.id === r.id && selectedSong.provider === r.provider
                    ? "border-black/30 bg-black/5 dark:border-white/30 dark:bg-white/10"
                    : "border-black/10 hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10",
                ].join(" ")}
              >
                <div className="h-10 w-10 overflow-hidden rounded-lg bg-black/5 dark:bg-white/10">
                  {r.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{r.title}</div>
                  <div className="truncate text-xs text-black/70 dark:text-white/70">{r.subtitle}</div>
                </div>
              </button>
            ))}
            {songResults.length === 0 ? (
              <div className="text-sm text-black/60 dark:text-white/60">Search to see results.</div>
            ) : null}
          </div>
        </section>

        <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/15 dark:bg-black">
          <h2 className="text-lg font-semibold">Add a GIF or photo</h2>

          <div className="mt-4 grid gap-3">
            <div className="flex gap-2">
              <input
                value={gifQuery}
                onChange={(e) => setGifQuery(e.target.value)}
                placeholder="Search GIPHY…"
                className="h-11 w-full rounded-xl border border-black/10 bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-black/20 dark:border-white/15 dark:focus:ring-white/20"
              />
              <button
                type="button"
                onClick={searchGifs}
                disabled={gifLoading}
                className="h-11 shrink-0 rounded-xl border border-black/10 px-4 text-sm font-medium hover:bg-black/5 disabled:opacity-60 dark:border-white/15 dark:hover:bg-white/10"
              >
                {gifLoading ? "Searching…" : "Search"}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {gifResults.map((g) => (
                <button
                  key={g.url}
                  type="button"
                  onClick={() => setMedia({ type: "gif", url: g.url, alt: g.alt })}
                  className={[
                    "aspect-square overflow-hidden rounded-xl border",
                    media?.type === "gif" && media.url === g.url
                      ? "border-black/30 dark:border-white/30"
                      : "border-black/10 dark:border-white/15",
                  ].join(" ")}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g.preview} alt={g.alt} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>

            <div className="rounded-xl border border-dashed border-black/15 p-4 text-sm dark:border-white/20">
              <div className="font-medium">Or upload a photo</div>
              <div className="mt-2 flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void onUpload(file);
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/15 dark:bg-black">
          <h2 className="text-lg font-semibold">Write your note</h2>
          <div className="mt-4 grid gap-3">
            <input
              value={toName}
              onChange={(e) => setToName(e.target.value)}
              placeholder="Recipient name (e.g., Sam)"
              className="h-11 w-full rounded-xl border border-black/10 bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-black/20 dark:border-white/15 dark:focus:ring-white/20"
            />
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Short message…"
              rows={4}
              className="w-full resize-none rounded-xl border border-black/10 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/20 dark:border-white/15 dark:focus:ring-white/20"
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void createCard()}
              disabled={!canSubmit || submitting}
              className="h-11 rounded-xl bg-foreground px-5 text-sm font-medium text-background hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? "Creating…" : "Generate share link"}
            </button>
            {shareUrl ? (
              <div className="flex min-w-0 items-center gap-2 rounded-xl border border-black/10 px-3 py-2 text-sm dark:border-white/15">
                <span className="truncate">{shareUrl}</span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(shareUrl)}
                  className="shrink-0 rounded-lg border border-black/10 px-2 py-1 text-xs hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
                >
                  Copy
                </button>
              </div>
            ) : null}
            {error ? <div className="text-sm text-red-600">{error}</div> : null}
          </div>
        </section>
      </div>

      <aside className="lg:sticky lg:top-6">
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/15 dark:bg-black">
          <div className="text-sm font-semibold">Live preview</div>
          <div className="mt-4 grid gap-4">
            <div className="aspect-video overflow-hidden rounded-xl border border-black/10 dark:border-white/15">
              {selectedSong ? (
                <iframe
                  src={selectedSong.embedUrl}
                  className="h-full w-full"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  title="Song preview"
                />
              ) : (
                <div className="grid h-full place-items-center text-sm text-black/60 dark:text-white/60">
                  Select a song to preview.
                </div>
              )}
            </div>
            <div className="aspect-square overflow-hidden rounded-xl border border-black/10 dark:border-white/15">
              {media ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={media.url} alt={media.alt ?? ""} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center text-sm text-black/60 dark:text-white/60">
                  Choose a GIF or upload an image.
                </div>
              )}
            </div>
            <div className="rounded-xl border border-black/10 p-4 dark:border-white/15">
              <div className="text-sm">
                <span className="font-semibold">To:</span>{" "}
                {toName.trim() ? toName.trim() : "—"}
              </div>
              <div className="mt-2 whitespace-pre-wrap text-sm text-black/75 dark:text-white/75">
                {message.trim() ? message.trim() : "Your message will appear here."}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

