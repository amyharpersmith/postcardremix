"use client";

import { useMemo, useState } from "react";

type MediaType = "gif" | "image";
type ContentMode = "song" | "playlist";

type SongResult = {
  id: string;
  title: string;
  subtitle: string;
  url: string;
  embedUrl: string;
  thumbnailUrl?: string;
};

type PlaylistInfo = {
  title: string;
  playlistId: string;
  embedUrl: string;
  url: string;
};

type PlaylistSong = {
  id: string;
  title: string;
  subtitle: string;
  videoId: string;
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
  song: {
    provider: "youtube";
    title: string;
    subtitle: string;
    url: string;
    embedUrl: string;
    thumbnailUrl?: string;
  };
  media: Media;
  playlistSongs?: PlaylistSong[];
};

function extractPlaylistId(url: string): string | null {
  try {
    const u = new URL(url);
    return u.searchParams.get("list");
  } catch {
    return null;
  }
}

export default function CreatePage() {
  const [mode, setMode] = useState<ContentMode>("song");

  // Song search
  const [songQuery, setSongQuery] = useState("");
  const [songResults, setSongResults] = useState<SongResult[]>([]);
  const [songLoading, setSongLoading] = useState(false);
  const [selectedSong, setSelectedSong] = useState<SongResult | null>(null);

  // Playlist (for YouTube linked playlists - kept for backward compat)
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [playlistInfo, setPlaylistInfo] = useState<PlaylistInfo | null>(null);
  const [playlistError, setPlaylistError] = useState<string | null>(null);

  // Custom playlist
  const [playlistSongs, setPlaylistSongs] = useState<PlaylistSong[]>([]);

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
    const hasContent = mode === "song" ? selectedSong : (playlistSongs.length > 0 || playlistInfo);
    return Boolean(hasContent && media && toName.trim() && message.trim());
  }, [mode, selectedSong, playlistSongs, playlistInfo, media, toName, message]);

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
      const res = await fetch(`/api/search/youtube?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Search failed");
      setSongResults(json.results as SongResult[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setSongLoading(false);
    }
  }

  function handlePlaylistUrlChange(url: string) {
    setPlaylistUrl(url);
    setPlaylistError(null);
    
    const url_trimmed = url.trim();
    if (!url_trimmed) {
      setPlaylistInfo(null);
      return;
    }

    const playlistId = extractPlaylistId(url_trimmed);
    if (!playlistId) {
      setPlaylistError("Invalid YouTube playlist URL. Use: https://www.youtube.com/playlist?list=...");
      setPlaylistInfo(null);
      return;
    }

    const playlistName = "Playlist";
    setPlaylistInfo({
      title: playlistName,
      playlistId,
      url: url_trimmed,
      embedUrl: `https://www.youtube.com/embed/videoseries?list=${encodeURIComponent(playlistId)}`,
    });
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
    let content: { title: string; subtitle: string; url: string; embedUrl: string; thumbnailUrl?: string } | null = null;
    
    if (mode === "song" && selectedSong) {
      content = selectedSong;
    } else if (mode === "playlist" && playlistSongs.length > 0) {
      content = {
        title: `Playlist (${playlistSongs.length} songs)`,
        subtitle: playlistSongs[0].title,
        url: "",
        embedUrl: `custom://playlist/${playlistSongs.map((s) => s.videoId).join(",")}`,
      };
    } else if (mode === "playlist" && playlistInfo) {
      content = {
        title: playlistInfo.title,
        subtitle: "Playlist",
        url: playlistInfo.url,
        embedUrl: playlistInfo.embedUrl,
      };
    }

    if (!content || !media) return;
    
    setSubmitting(true);
    setError(null);
    setShareUrl(null);
    try {
      const body: CreateCardRequest = {
        toName: toName.trim(),
        message: message.trim(),
        song: {
          provider: "youtube",
          title: content.title,
          subtitle: content.subtitle,
          url: content.url,
          embedUrl: content.embedUrl,
          thumbnailUrl: content.thumbnailUrl,
        },
        media,
        playlistSongs: playlistSongs.length > 0 ? playlistSongs : undefined,
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
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_22rem] w-full items-start">
      <div className="grid gap-6 min-w-0">
        <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/15 dark:bg-black">
          <h2 className="text-lg font-semibold">Pick content</h2>
          
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setMode("song");
                setSongResults([]);
                setSelectedSong(null);
                setError(null);
              }}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                mode === "song"
                  ? "bg-foreground text-background"
                  : "border border-black/10 hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
              }`}
            >
              Song
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("playlist");
                setPlaylistUrl("");
                setPlaylistInfo(null);
                setPlaylistError(null);
                setError(null);
              }}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                mode === "playlist"
                  ? "bg-foreground text-background"
                  : "border border-black/10 hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
              }`}
            >
              Playlist
            </button>
          </div>

          {mode === "song" ? (
            <div className="mt-4 grid gap-3">
              <div className="flex gap-2">
                <input
                  value={songQuery}
                  onChange={(e) => setSongQuery(e.target.value)}
                  placeholder="Search for a song..."
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

              <div className="grid gap-2">
                {songResults.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedSong(r)}
                    className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-left ${
                      selectedSong?.id === r.id
                        ? "border-black/30 bg-black/5 dark:border-white/30 dark:bg-white/10"
                        : "border-black/10 hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
                    }`}
                  >
                    <div className="h-10 w-10 overflow-hidden rounded-lg bg-black/5 dark:bg-white/10">
                      {r.thumbnailUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{r.title}</div>
                      <div className="truncate text-xs text-black/70 dark:text-white/70">{r.subtitle}</div>
                    </div>
                  </button>
                ))}
                {songResults.length === 0 && (
                  <div className="text-sm text-black/60 dark:text-white/60">Search to see results.</div>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-4 grid gap-3">
              <div>
                <label className="text-sm font-medium text-black/70 dark:text-white/70">
                  Add songs to your playlist
                </label>
                <div className="mt-2 flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input
                      value={songQuery}
                      onChange={(e) => setSongQuery(e.target.value)}
                      placeholder="Search for songs..."
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

                  <div className="grid gap-2 max-h-48 overflow-y-auto">
                    {songResults.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          if (!playlistSongs.find((s) => s.id === r.id)) {
                            setPlaylistSongs([
                              ...playlistSongs,
                              {
                                id: r.id,
                                title: r.title,
                                subtitle: r.subtitle,
                                videoId: r.embedUrl.split("/embed/")[1],
                                thumbnailUrl: r.thumbnailUrl,
                              },
                            ]);
                          }
                        }}
                        className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-left ${
                          playlistSongs.find((s) => s.id === r.id)
                            ? "border-green-300 bg-green-50 dark:border-green-900 dark:bg-green-950"
                            : "border-black/10 hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
                        }`}
                      >
                        <div className="h-10 w-10 overflow-hidden rounded-lg bg-black/5 dark:bg-white/10">
                          {r.thumbnailUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={r.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold">{r.title}</div>
                          <div className="truncate text-xs text-black/70 dark:text-white/70">{r.subtitle}</div>
                        </div>
                        {playlistSongs.find((s) => s.id === r.id) && (
                          <div className="shrink-0 text-green-600">✓</div>
                        )}
                      </button>
                    ))}
                    {songResults.length === 0 && (
                      <div className="text-sm text-black/60 dark:text-white/60">Search to see results.</div>
                    )}
                  </div>
                </div>
              </div>

              {playlistSongs.length > 0 && (
                <div className="mt-2 rounded-xl border border-black/10 bg-black/2 p-3 dark:border-white/15 dark:bg-white/5">
                  <div className="text-xs font-semibold text-black/70 dark:text-white/70">
                    Playlist ({playlistSongs.length} songs)
                  </div>
                  <div className="mt-2 space-y-1">
                    {playlistSongs.map((song, idx) => (
                      <div key={song.id} className="flex items-center gap-2 rounded-lg bg-black/5 p-2 dark:bg-white/10">
                        <div className="text-xs font-medium text-black/60 dark:text-white/60 w-5">{idx + 1}.</div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs font-medium">{song.title}</div>
                          <div className="truncate text-xs text-black/50 dark:text-white/50">{song.subtitle}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPlaylistSongs(playlistSongs.filter((s) => s.id !== song.id))}
                          className="shrink-0 text-xs px-2 py-1 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
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

            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 w-full">
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

      <aside className="w-full min-w-0">
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/15 dark:bg-black">
          <div className="text-sm font-semibold">Live preview</div>
          <div className="mt-4 grid gap-4">
            <div className="aspect-video overflow-hidden rounded-xl border border-black/10 dark:border-white/15">
              {mode === "song" ? (
                selectedSong ? (
                  <iframe
                    src={selectedSong.embedUrl}
                    className="h-full w-full"
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                    title="Song preview"
                  />
                ) : (
                  <div className="grid h-full place-items-center text-sm text-black/60 dark:text-white/60">
                    Search and select a song to preview.
                  </div>
                )
              ) : playlistSongs.length > 0 ? (
                <div className="h-full w-full bg-black text-white flex flex-col p-4 overflow-hidden">
                  <div className="text-sm font-semibold mb-2">Playlist ({playlistSongs.length} songs)</div>
                  <div className="flex-1 overflow-y-auto text-xs space-y-1">
                    {playlistSongs.map((song, idx) => (
                      <div key={song.id} className="flex items-start gap-2 pb-1 border-b border-white/10">
                        <div className="text-white/60 w-5 shrink-0">{idx + 1}.</div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate">{song.title}</div>
                          <div className="text-white/60 truncate">{song.subtitle}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : playlistInfo ? (
                <iframe
                  src={playlistInfo.embedUrl}
                  className="h-full w-full"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  title="Playlist preview"
                />
              ) : (
                <div className="grid h-full place-items-center text-sm text-black/60 dark:text-white/60">
                  Search and add songs to create a playlist.
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

