"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import create from "../../create/create.module.css";
import view from "./view.module.css";

type YTPlayer = { destroy?: () => void };
type YTEvent = { data: number };
type YTGlobal = {
  Player: new (
    el: HTMLIFrameElement,
    opts: { events: { onStateChange: (e: YTEvent) => void } },
  ) => YTPlayer;
  PlayerState: { PLAYING: number; ENDED: number };
};
declare global {
  interface Window {
    YT?: YTGlobal;
    onYouTubeIframeAPIReady?: () => void;
  }
}

function withJsApi(url: string): string {
  if (!url.startsWith("https://www.youtube.com/embed/")) return url;
  const [base, query = ""] = url.split("?");
  const params = new URLSearchParams(query);
  params.set("enablejsapi", "1");
  params.set("autoplay", "1");
  params.set("playsinline", "1");
  return `${base}?${params.toString()}`;
}

type Card = {
  id: string;
  version: number;
  createdAt: string;
  toName: string;
  message: string;
  caption?: string;
  media: { type: "gif" | "image"; url: string; alt?: string };
  song: {
    provider: "youtube";
    title: string;
    subtitle: string;
    url: string;
    embedUrl: string;
    thumbnailUrl?: string;
  };
  playlistSongs?: Array<{
    id: string;
    title: string;
    subtitle: string;
    videoId: string;
    thumbnailUrl?: string;
  }>;
};

export default function CardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [card, setCard] = useState<Card | null>(null);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [flipping, setFlipping] = useState(false);

  const [notFoundState, setNotFoundState] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    params.then(async ({ id }) => {
      try {
        const res = await fetch(`/api/cards/${id}`);
        if (res.status === 404) {
          setNotFoundState(true);
          setLoading(false);
          return;
        }
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        const fetchedCard = (await res.json()) as Card;
        setCard(fetchedCard);
      } catch (err) {
        console.error(err);
        setNotFoundState(true);
      } finally {
        setLoading(false);
      }
    });
  }, [params]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) {
      setIsPlaying(false);
      return;
    }

    let cancelled = false;
    let player: YTPlayer | null = null;

    function attach() {
      if (cancelled || !iframe) return;
      const YT = window.YT;
      if (!YT?.Player) {
        window.setTimeout(attach, 100);
        return;
      }
      const playlistLength = card?.playlistSongs?.length ?? 0;
      player = new YT.Player(iframe, {
        events: {
          onStateChange: (e) => {
            setIsPlaying(e.data === YT.PlayerState.PLAYING);
            if (e.data === YT.PlayerState.ENDED && playlistLength > 0) {
              setCurrentSongIndex((i) =>
                i < playlistLength - 1 ? i + 1 : i,
              );
            }
          },
        },
      });
    }

    if (!window.YT) {
      const existing = document.querySelector<HTMLScriptElement>(
        'script[src="https://www.youtube.com/iframe_api"]',
      );
      if (!existing) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prev) prev();
        attach();
      };
    } else {
      attach();
    }

    return () => {
      cancelled = true;
      if (player?.destroy) player.destroy();
      setIsPlaying(false);
    };
  }, [card?.id, currentSongIndex]);

  const prevSideRef = useRef<"A" | "B">("A");
  useEffect(() => {
    const hasTwoSides =
      (card?.playlistSongs?.length ?? 0) > 3;
    const side: "A" | "B" =
      hasTwoSides && currentSongIndex >= 3 ? "B" : "A";
    if (side !== prevSideRef.current) {
      prevSideRef.current = side;
      setFlipping(true);
      const t = window.setTimeout(() => setFlipping(false), 800);
      return () => window.clearTimeout(t);
    }
  }, [card?.playlistSongs?.length, currentSongIndex]);

  if (notFoundState) notFound();

  if (loading) {
    return (
      <div className={create.wrap}>
        <div className={view.loading}>loading postcard</div>
      </div>
    );
  }

  if (!card) return notFound();

  const isCustomPlaylist = (card.playlistSongs && card.playlistSongs.length > 0) ?? false;
  const playlistSongs = card.playlistSongs ?? [];
  const currentSong = isCustomPlaylist ? playlistSongs[currentSongIndex] : null;
  const hasTwoSides = isCustomPlaylist && playlistSongs.length > 3;
  const currentSide: "A" | "B" = hasTwoSides && currentSongIndex >= 3 ? "B" : "A";
  const embedUrl = withJsApi(
    currentSong
      ? `https://www.youtube.com/embed/${currentSong.videoId}`
      : card.song.embedUrl,
  );

  const nowPlayingText = currentSong
    ? `${currentSong.title}${currentSong.subtitle ? ` — ${currentSong.subtitle}` : ""}`
    : `${card.song.title}${card.song.subtitle ? ` — ${card.song.subtitle}` : ""}`;

  return (
    <div className={create.wrap}>
      <header className={create.hero}>
        <div className={create.logo}>
          <span className={create.version}>v0.52</span>
          <h1>SIDE {currentSide}</h1>
        </div>
      </header>

      <p className={create.path}>
        ~/cards <span className={create.sep}>›</span>{" "}
        <span className={create.hl}>{card.id}</span>
      </p>

      <section className={view.viewGrid}>
        <div>
          <div className={create.postcard}>
            <div className={create.polaroid}>
              <div className={create.photo}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={card.media.url} alt={card.media.alt ?? ""} />
              </div>
              <div className={create.caption}>{card.caption || `side a · for ${card.toName}`}</div>
            </div>

            <div className={`${create.miniCassette} ${flipping ? create.miniCassetteFlip : ""}`}>
              <div className={create.rainbow} />
              <div className={create.reels}>
                <div
                  className={`${create.reel} ${isPlaying ? "" : create.reelPaused}`}
                />
                <div
                  className={`${create.reel} ${create.reelSlow} ${isPlaying ? "" : create.reelPaused}`}
                />
              </div>
              <div className={create.labelStrip}>
                <span className={create.song}>{nowPlayingText}</span>
                <span>SIDE {currentSide}</span>
              </div>
            </div>

            <div className={create.pcMessage}>{card.message}</div>

            <div className={create.pcFooter}>
              <span>
                To: <strong className={create.recipient}>{card.toName}</strong>
              </span>
              <span className={create.stamp}>♥ REMIX &apos;86</span>
            </div>
          </div>
        </div>

        <div className={view.playerPanel}>
          <div className={create.panel}>
            <div className={create.panelTitle}>
              Now Playing <div className={create.stripes} />
            </div>

            <div className={view.tvFrame}>
              <div className={view.playerFrame}>
                <iframe
                  key={embedUrl}
                  ref={iframeRef}
                  src={embedUrl}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  title={currentSong?.title ?? card.song.title ?? "Song"}
                />
              </div>
              <div className={view.tvControls}>
                <span className={view.tvBrand}>
                  <span className={view.tvLed} />
                  POSTCARD-REMIX
                </span>
                <div className={view.tvKnobs}>
                  <span className={view.tvKnob} />
                  <span className={view.tvKnob} />
                </div>
              </div>
            </div>

            {isCustomPlaylist && (
              <>
                <div className={view.playlistControls} style={{ marginTop: 12 }}>
                  <span>
                    TRACK {currentSongIndex + 1} / {playlistSongs.length}
                  </span>
                  <div className={view.navBtns}>
                    <button
                      type="button"
                      className={view.navBtn}
                      onClick={() => setCurrentSongIndex((i) => Math.max(0, i - 1))}
                      disabled={currentSongIndex === 0}
                      aria-label="Previous song"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      className={view.navBtn}
                      onClick={() =>
                        setCurrentSongIndex((i) => Math.min(playlistSongs.length - 1, i + 1))
                      }
                      disabled={currentSongIndex === playlistSongs.length - 1}
                      aria-label="Next song"
                    >
                      →
                    </button>
                  </div>
                </div>

                <div className={view.tracklist} style={{ marginTop: 8 }}>
                  {playlistSongs.map((song, idx) => (
                    <button
                      key={song.id}
                      type="button"
                      onClick={() => setCurrentSongIndex(idx)}
                      className={`${view.track} ${idx === currentSongIndex ? view.trackActive : ""}`}
                    >
                      <span className={view.trackNum}>{idx + 1}.</span>
                      <span className={view.trackTitle}>{song.title}</span>
                      {idx === currentSongIndex && <span className={view.trackMark}>▶</span>}
                    </button>
                  ))}
                </div>
              </>
            )}

            <div className={view.meta} style={{ marginTop: 12 }}>
              <span>YouTube Music</span>
              {isCustomPlaylist ? (
                <span>· Playlist · {playlistSongs.length} songs</span>
              ) : card.song.url ? (
                <a href={card.song.url} target="_blank" rel="noreferrer">
                  Open on YouTube ↗
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <div className={view.ctaRow}>
        <Link href="/create" className={`${create.btn} ${create.btnPrimary}`}>
          CREATE YOUR OWN CARD
        </Link>
      </div>
    </div>
  );
}
