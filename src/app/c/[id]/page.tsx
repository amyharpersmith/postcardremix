import { notFound } from "next/navigation";
import { getCard } from "@/lib/storage/cards";

type Card = {
  id: string;
  version: number;
  createdAt: string;
  toName: string;
  message: string;
  media: { type: "gif" | "image"; url: string; alt?: string };
  song: {
    provider: "genius" | "youtube";
    title: string;
    subtitle: string;
    url: string;
    embedUrl: string;
    thumbnailUrl?: string;
  };
};

export default async function CardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const card = (await getCard(id)) as unknown as Card | null;
  if (!card) return notFound();

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
        <div className="aspect-video overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm dark:border-white/15 dark:bg-black">
          {card.song.provider === "youtube" ? (
            <iframe
              src={card.song.embedUrl}
              className="h-full w-full"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              title="Song"
            />
          ) : card.song.provider === "genius" ? (
            <a
              href={card.song.url}
              target="_blank"
              rel="noreferrer"
              className="flex h-full w-full items-center justify-center bg-gradient-to-br from-black/5 to-black/10 p-6 text-center hover:from-black/10 hover:to-black/15 dark:from-white/5 dark:to-white/10 dark:hover:from-white/10 dark:hover:to-white/15"
            >
              <div>
                <div className="text-sm font-medium text-black/60 dark:text-white/60">Genius</div>
                <div className="mt-2 line-clamp-3 text-lg font-semibold">{card.song.title}</div>
                <div className="mt-1 text-sm text-black/50 dark:text-white/50">{card.song.subtitle}</div>
                {card.song.thumbnailUrl && (
                  <div className="mt-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={card.song.thumbnailUrl}
                      alt={card.song.title}
                      className="h-12 w-12 rounded-lg object-cover mx-auto"
                    />
                  </div>
                )}
                <div className="mt-4 inline-flex rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90">
                  Open on Genius
                </div>
              </div>
            </a>
          ) : null}
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
        {card.song.provider === "genius" ? "Genius" : "YouTube"} •{" "}
        <a href={card.song.url} className="underline" target="_blank" rel="noreferrer">
          Open source
        </a>
      </div>
    </div>
  );
}

