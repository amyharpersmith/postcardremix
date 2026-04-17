"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { nanoid } from "nanoid";
import styles from "./create.module.css";

type MediaType = "gif" | "image";
type ContentMode = "search" | "url";
type MediaTab = "gif" | "upload";

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
  caption: string;
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
  customSlug?: string;
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
  const [mode, setMode] = useState<ContentMode>("search");
  const [mediaTab, setMediaTab] = useState<MediaTab>("gif");

  const [songQuery, setSongQuery] = useState("");
  const [songResults, setSongResults] = useState<SongResult[]>([]);
  const [songLoading, setSongLoading] = useState(false);
  const [selectedSong, setSelectedSong] = useState<SongResult | null>(null);

  const [playlistUrl, setPlaylistUrl] = useState("");
  const [playlistInfo, setPlaylistInfo] = useState<PlaylistInfo | null>(null);
  const [playlistError, setPlaylistError] = useState<string | null>(null);
  const [playlistSongs, setPlaylistSongs] = useState<PlaylistSong[]>([]);

  const [gifQuery, setGifQuery] = useState("");
  const [gifResults, setGifResults] = useState<Array<{ url: string; preview: string; alt: string }>>([]);
  const [gifLoading, setGifLoading] = useState(false);

  const [media, setMedia] = useState<Media | null>(null);

  const [toName, setToName] = useState("you");
  const [caption, setCaption] = useState("side a · spring '86");
  const [message, setMessage] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [customSlug, setCustomSlug] = useState("");

  const captionRef = useRef<HTMLDivElement | null>(null);
  const recipientRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (captionRef.current && captionRef.current.textContent !== caption) {
      captionRef.current.textContent = caption;
    }
  }, [caption]);

  useEffect(() => {
    if (recipientRef.current && recipientRef.current.textContent !== toName) {
      recipientRef.current.textContent = toName;
    }
  }, [toName]);

  const canSubmit = useMemo(() => {
    const hasContent =
      mode === "search" ? Boolean(selectedSong) : playlistSongs.length > 0 || Boolean(playlistInfo);
    return Boolean(hasContent && media && toName.trim() && message.trim());
  }, [mode, selectedSong, playlistSongs, playlistInfo, media, toName, message]);

  const nowPlayingText = useMemo(() => {
    if (mode === "search" && selectedSong) {
      return `${selectedSong.title} — ${selectedSong.subtitle}`;
    }
    if (mode === "url" && playlistSongs.length > 0) {
      return `Playlist · ${playlistSongs.length} songs`;
    }
    if (mode === "url" && playlistInfo) {
      return playlistInfo.title;
    }
    return "— no song selected —";
  }, [mode, selectedSong, playlistSongs, playlistInfo]);

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

    const trimmed = url.trim();
    if (!trimmed) {
      setPlaylistInfo(null);
      return;
    }

    const playlistId = extractPlaylistId(trimmed);
    if (!playlistId) {
      setPlaylistError("Invalid YouTube playlist URL. Use: https://www.youtube.com/playlist?list=…");
      setPlaylistInfo(null);
      return;
    }

    setPlaylistInfo({
      title: "Playlist",
      playlistId,
      url: trimmed,
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
      if (!file.type.startsWith("image/")) {
        throw new Error("Only image uploads are supported");
      }
      if (file.size > 15 * 1024 * 1024) {
        throw new Error("File too large (max 15MB)");
      }
      const ext = file.name.includes(".") ? file.name.split(".").pop() : "png";
      const path = `uploads/${nanoid(10)}.${ext}`;
      const blob = await upload(path, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
        contentType: file.type,
      });
      setMedia({ type: "image", url: blob.url, alt: file.name });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    }
  }

  async function createCard() {
    let content: SongResult | null = null;

    if (mode === "search" && selectedSong) {
      content = selectedSong;
    } else if (mode === "url" && playlistSongs.length > 0) {
      content = {
        id: "playlist",
        title: `Playlist (${playlistSongs.length} songs)`,
        subtitle: playlistSongs[0].title,
        url: "",
        embedUrl: `custom://playlist/${playlistSongs.map((s) => s.videoId).join(",")}`,
      };
    } else if (mode === "url" && playlistInfo) {
      content = {
        id: playlistInfo.playlistId,
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
        caption: caption.trim(),
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
      const trimmedSlug = customSlug.trim().toLowerCase();
      const res = await fetch("/api/cards", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(trimmedSlug ? { ...body, customSlug: trimmedSlug } : body),
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

  function handleModeChange(next: ContentMode) {
    setMode(next);
    setSongResults([]);
    setSelectedSong(null);
    setError(null);
    if (next === "search") {
      setPlaylistUrl("");
      setPlaylistInfo(null);
      setPlaylistError(null);
    }
  }

  function handleKeyNav(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && canSubmit) {
      e.preventDefault();
      void createCard();
    }
  }

  const onEditablePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\n/g, " ");
    document.execCommand("insertText", false, text);
  };

  return (
    <div className={styles.wrap} onKeyDown={handleKeyNav}>
      <header className={styles.hero}>
        <div className={styles.logo}>
          <span className={styles.brandSmall}>Postcard</span>
          <span className={styles.version}>v0.52</span>
          <h1>REMIX</h1>
        </div>
        <div className={styles.topStatus}>
          <span>
            <span className={`${styles.dot} ${styles.dotG}`} /> YouTube · ready
          </span>
          <span>
            <span className={`${styles.dot} ${styles.dotY}`} /> GIPHY · ready
          </span>
        </div>
      </header>

      <p className={styles.path}>
        discofries <span className={styles.sep}>›</span>{" "}
        <span className={styles.hl}>new postcard</span>{" "}
        <span className={styles.sep}>›</span> Side A
      </p>

      <section className={styles.grid}>
        <div className={styles.panel}>
          <div className={styles.panelTitle}>
            Build Your Card <div className={styles.stripes} />
          </div>

          <div className={styles.section}>
            <div className={`${styles.panelTitle} ${styles.panelTitleInner}`}>
              1 · Pick a Song <div className={styles.stripes} />
              <button
                type="button"
                className={`${styles.toggle} ${mode === "search" ? styles.toggleOn : ""}`}
                onClick={() => handleModeChange("search")}
              >
                <span className={styles.radio} /> Search
              </button>
              <button
                type="button"
                className={`${styles.toggle} ${mode === "url" ? styles.toggleOn : ""}`}
                onClick={() => handleModeChange("url")}
              >
                <span className={styles.radio} /> Playlist URL
              </button>
            </div>

            {mode === "search" ? (
              <>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void searchSongs();
                  }}
                  className={styles.prompt}
                >
                  <span className={styles.caret}>&gt;</span>
                  <input
                    value={songQuery}
                    onChange={(e) => setSongQuery(e.target.value)}
                    placeholder="take on me, a-ha"
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <button
                    type="submit"
                    className={styles.searchBtn}
                    disabled={songLoading}
                  >
                    {songLoading ? "…" : "SEARCH"}
                  </button>
                  <span className={styles.block} />
                </form>
                <div className={styles.results}>
                  {songResults.length === 0 && (
                    <div className={styles.emptyHint}>Search to find songs.</div>
                  )}
                  {songResults.map((r) => {
                    const selected = selectedSong?.id === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        className={`${styles.res} ${selected ? styles.resSelected : ""}`}
                        onClick={() => setSelectedSong(r)}
                      >
                        <div className={styles.thumb}>
                          {r.thumbnailUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={r.thumbnailUrl} alt="" />
                          )}
                        </div>
                        <div className={styles.resText}>
                          <div className={styles.resTitle}>{r.title}</div>
                          <div className={styles.resMeta}>{r.subtitle}</div>
                        </div>
                        <span className={styles.pick}>{selected ? "✓ PICKED" : "+ PICK"}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void searchSongs();
                  }}
                  className={styles.prompt}
                >
                  <span className={styles.caret}>&gt;</span>
                  <input
                    value={songQuery}
                    onChange={(e) => setSongQuery(e.target.value)}
                    placeholder="search songs to add…"
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <button
                    type="submit"
                    className={styles.searchBtn}
                    disabled={songLoading}
                  >
                    {songLoading ? "…" : "SEARCH"}
                  </button>
                  <span className={styles.block} />
                </form>

                <div className={styles.results}>
                  {songResults.length === 0 && (
                    <div className={styles.emptyHint}>
                      Search and add songs, or paste a playlist URL below.
                    </div>
                  )}
                  {songResults.map((r) => {
                    const added = playlistSongs.some((s) => s.id === r.id);
                    return (
                      <button
                        key={r.id}
                        type="button"
                        className={`${styles.res} ${added ? styles.resSelected : ""}`}
                        onClick={() => {
                          if (added) return;
                          setPlaylistSongs([
                            ...playlistSongs,
                            {
                              id: r.id,
                              title: r.title,
                              subtitle: r.subtitle,
                              videoId: r.embedUrl.split("/embed/")[1] ?? r.id,
                              thumbnailUrl: r.thumbnailUrl,
                            },
                          ]);
                        }}
                      >
                        <div className={styles.thumb}>
                          {r.thumbnailUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={r.thumbnailUrl} alt="" />
                          )}
                        </div>
                        <div className={styles.resText}>
                          <div className={styles.resTitle}>{r.title}</div>
                          <div className={styles.resMeta}>{r.subtitle}</div>
                        </div>
                        <span className={styles.pick}>{added ? "✓ ADDED" : "+ ADD"}</span>
                      </button>
                    );
                  })}
                </div>

                {playlistSongs.length > 0 && (
                  <div className={styles.playlistBox}>
                    <div className={styles.plTitle}>
                      PLAYLIST · {playlistSongs.length} SONGS
                    </div>
                    <div className={styles.playlistList}>
                      {playlistSongs.map((song, i) => (
                        <div key={song.id} className={styles.plItem}>
                          <span className={styles.num}>{i + 1}.</span>
                          <span className={styles.plSongTitle}>{song.title}</span>
                          <button
                            type="button"
                            className={styles.remove}
                            onClick={() =>
                              setPlaylistSongs(playlistSongs.filter((s) => s.id !== song.id))
                            }
                          >
                            REMOVE
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className={styles.playlistUrlInput}>
                  <div className={styles.prompt}>
                    <span className={styles.caret}>&gt;</span>
                    <input
                      value={playlistUrl}
                      onChange={(e) => handlePlaylistUrlChange(e.target.value)}
                      placeholder="or paste a youtube playlist URL…"
                      autoComplete="off"
                      spellCheck={false}
                    />
                  </div>
                  {playlistError && (
                    <div className={styles.playlistUrlError}>{playlistError}</div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className={styles.section}>
            <div className={`${styles.panelTitle} ${styles.panelTitleInner}`}>
              2 · Add a GIF or Photo <div className={styles.stripes} />
            </div>
            <div className={styles.tabs}>
              <button
                type="button"
                className={`${styles.tab} ${mediaTab === "gif" ? styles.tabActive : ""}`}
                onClick={() => setMediaTab("gif")}
              >
                GIPHY Search
              </button>
              <button
                type="button"
                className={`${styles.tab} ${mediaTab === "upload" ? styles.tabActive : ""}`}
                onClick={() => setMediaTab("upload")}
              >
                Upload Photo
              </button>
            </div>

            {mediaTab === "gif" ? (
              <>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void searchGifs();
                  }}
                  className={styles.prompt}
                >
                  <span className={styles.caret}>&gt;</span>
                  <input
                    value={gifQuery}
                    onChange={(e) => setGifQuery(e.target.value)}
                    placeholder="neon, sunset, cat"
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <button
                    type="submit"
                    className={styles.searchBtn}
                    disabled={gifLoading}
                  >
                    {gifLoading ? "…" : "SEARCH"}
                  </button>
                  <span className={styles.block} />
                </form>
                <div className={styles.gifGrid}>
                  {gifResults.length === 0 && (
                    <div className={styles.emptyHint} style={{ gridColumn: "1 / -1" }}>
                      Search GIPHY to find a GIF.
                    </div>
                  )}
                  {gifResults.map((g) => {
                    const selected = media?.type === "gif" && media.url === g.url;
                    return (
                      <button
                        key={g.url}
                        type="button"
                        className={`${styles.gifCell} ${selected ? styles.gifCellSelected : ""}`}
                        onClick={() => setMedia({ type: "gif", url: g.url, alt: g.alt })}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={g.preview} alt={g.alt} />
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <label className={styles.upload}>
                <div className={styles.uploadIcon}>📸</div>
                <div>
                  <strong>Click to upload</strong> or drop an image here
                </div>
                <div className={styles.uploadHint}>PNG · JPG · GIF · up to 5MB</div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void onUpload(file);
                  }}
                />
              </label>
            )}
          </div>

          <div className={styles.section}>
            <div className={`${styles.panelTitle} ${styles.panelTitleInner}`}>
              3 · Write a Note <div className={styles.stripes} />
            </div>
            <div className={styles.messageWrap}>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={240}
                placeholder="miss you. play loud. side A for the drive home…"
              />
              <div className={styles.messageMeta}>
                <span>
                  Signed with <strong className={styles.by}>♥</strong>
                </span>
                <span>{message.length} / 240</span>
              </div>
            </div>
          </div>

          <div className={styles.note}>
            <span className={styles.tag}>TIP</span>
            <p>
              Press <span>⌘/Ctrl + Enter</span> to share it. We&apos;ll generate a short URL that
              renders your card.
            </p>
          </div>
        </div>

        <div className={styles.previewPanel}>
          <div className={styles.postcard}>
            <div className={styles.polaroid}>
              <div className={styles.photo}>
                {media ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={media.url} alt={media.alt ?? ""} />
                ) : (
                  <div className={styles.placeholder}>
                    pick a gif or upload a photo
                    <br />
                    to fill this frame
                  </div>
                )}
              </div>
              <div
                ref={captionRef}
                className={styles.caption}
                contentEditable
                suppressContentEditableWarning
                spellCheck={false}
                data-placeholder="tap to write a caption…"
                data-tooltip="✎ click to edit caption"
                title="Click to edit caption"
                onInput={(e) => setCaption((e.target as HTMLDivElement).textContent ?? "")}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    (e.target as HTMLDivElement).blur();
                  }
                }}
                onPaste={onEditablePaste}
              />
            </div>

            <div className={styles.miniCassette}>
              <div className={styles.rainbow} />
              <div className={styles.reels}>
                <div className={styles.reel} />
                <div className={`${styles.reel} ${styles.reelSlow}`} />
              </div>
              <div className={styles.labelStrip}>
                <span className={styles.song}>{nowPlayingText}</span>
                <span>SIDE A</span>
              </div>
            </div>

            <div className={styles.pcMessage}>{message}</div>

            <div className={styles.pcFooter}>
              <span>
                To:{" "}
                <strong
                  ref={recipientRef}
                  className={styles.recipient}
                  contentEditable
                  suppressContentEditableWarning
                  spellCheck={false}
                  data-placeholder="someone…"
                  data-tooltip="✎ click to edit"
                  title="Click to edit recipient"
                  onInput={(e) => setToName((e.target as HTMLSpanElement).textContent ?? "")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      (e.target as HTMLSpanElement).blur();
                    }
                  }}
                  onPaste={onEditablePaste}
                />
              </span>
              <span className={styles.stamp}>♥ REMIX &apos;86</span>
            </div>
          </div>

          <div className={styles.customSlugRow}>
            <label className={styles.customSlugLabel} htmlFor="customSlug">
              CUSTOM LINK (optional)
            </label>
            <div className={styles.customSlugField}>
              <span className={styles.customSlugPrefix}>/c/</span>
              <input
                id="customSlug"
                type="text"
                value={customSlug}
                onChange={(e) =>
                  setCustomSlug(e.target.value.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 30))
                }
                placeholder="e.g. for-alex"
                maxLength={30}
                className={styles.customSlugInput}
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            <span className={styles.customSlugHint}>
              3–30 chars · lowercase letters, numbers, hyphens · leave blank for auto
            </span>
          </div>

          <div className={styles.shareRow}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={() => void createCard()}
              disabled={!canSubmit || submitting}
            >
              {submitting ? "CREATING…" : "SHARE · GET SHORT LINK"}
            </button>
          </div>

          {shareUrl && (
            <div className={styles.shareLink}>
              <span>{shareUrl}</span>
              <button type="button" onClick={() => navigator.clipboard.writeText(shareUrl)}>
                COPY
              </button>
            </div>
          )}

          {error && <div className={styles.errorMsg}>{error}</div>}
        </div>
      </section>

      <footer className={styles.keys}>
        <span>
          <kbd>↑↓</kbd> choose
        </span>
        <span>
          <kbd>tab</kbd> switch media
        </span>
        <span>
          <kbd>enter</kbd> add to card
        </span>
        <span>
          <kbd>ctrl</kbd>+<kbd>enter</kbd> share
        </span>
        <span>
          <kbd>esc</kbd> exit
        </span>
      </footer>
    </div>
  );
}
