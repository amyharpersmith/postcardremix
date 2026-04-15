"use client";

import { notFound } from "next/navigation";
import { getCard } from "@/lib/storage/cards";
import { useEffect, useState } from "react";

type Card = {
  id: string;
  version: number;
  createdAt: string;
  toName: string;
  message: string;
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

  useEffect(() => {
    params.then(async ({ id }) => {
      const fetchedCard = (await getCard(id)) as unknown as Card | null;
      if (!fetchedCard) {
        notFound();
      }
      setCard(fetchedCard);
      setLoading(false);
    });
  }, [params]);

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!card) return notFound();

  const isCustomPlaylist = card.playlistSongs && card.playlistSongs.length > 0;
  const currentSong = isCustomPlaylist
    ? card.playlistSongs![currentSongIndex]
    : null;
  const embedUrl = currentSong
    ? `https://www.youtube.com/embed/${currentSong.videoId}?autoplay=0`
    : card.song.embedUrl;

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/15 dark:bg-black">
        <div className="text-sm text-black/60 dark:text-white/60">To</div>
        <div className="text-2xl font-semibold tracking-tight">{card.toName}</div>
        <div className="mt-4 whitespace-pre-wrap text-sm text-black/75 dark:text-white/75">
          {card.message}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <div className="aspect-video overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm dark:border-white/15 dark:bg-black">
            <iframe
              src={embedUrl}
              className="h-full w-full"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              title={isCustomPlaylist ? currentSong?.title ?? "Playlist" : "Song"}
            />
          </div>

          {isCustomPlaylist && (
            <div className="rounded-2xl border border-black/10 bg-white shadow-sm dark:border-white/15 dark:bg-black overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-black/10 dark:border-white/15">
                <span className="text-xs font-semibold text-black/60 dark:text-white/60">
                  {currentSongIndex + 1} / {card.playlistSongs!.length}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentSongIndex((i) => Math.max(0, i - 1))}
                    disabled={currentSongIndex === 0}
                    className="h-8 w-8 rounded-lg border border-black/10 text-sm font-medium hover:bg-black/5 disabled:opacity-30 dark:border-white/15 dark:hover:bg-white/10"
                    aria-label="Previous song"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentSongIndex((i) => Math.min(card.playlistSongs!.length - 1, i + 1))}
                    disabled={currentSongIndex === card.playlistSongs!.length - 1}
                    className="h-8 w-8 rounded-lg border border-black/10 text-sm font-medium hover:bg-black/5 disabled:opacity-30 dark:border-white/15 dark:hover:bg-white/10"
                    aria-label="Next song"
                  >
                    →
                  </button>
                </div>
              </div>
              <div className="max-h-40 overflow-y-auto">
                {card.playlistSongs!.map((song, idx) => (
                  <button
                    key={song.id}
                    type="button"
                    onClick={() => setCurrentSongIndex(idx)}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-left text-xs border-b border-black/5 dark:border-white/5 last:border-0 ${
                      idx === currentSongIndex
                        ? "bg-black/5 dark:bg-white/10 font-semibold"
                        : "hover:bg-black/5 dark:hover:bg-white/10"
                    }`}
                  >
                    <span className="w-5 shrink-0 text-black/40 dark:text-white/40">{idx + 1}.</span>
                    <span className="min-w-0 flex-1 truncate">{song.title}</span>
                    {idx === currentSongIndex && (
                      <span className="shrink-0 text-black/60 dark:text-white/60">▶</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="aspect-square overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm dark:border-white/15 dark:bg-black">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={card.media.url}
            alt={card.media.alt ?? ""}
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      <div className="text-xs text-black/50 dark:text-white/50">
        YouTube Music
        {isCustomPlaylist ? (
          <span> • Custom Playlist • {card.playlistSongs!.length} songs</span>
        ) : (
          <span>
            {" "}
            •{" "}
            <a href={card.song.url} className="underline" target="_blank" rel="noreferrer">
              Open on YouTube
            </a>
          </span>
        )}
      </div>
    </div>
  );
}

