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
          <iframe
            src={card.song.embedUrl}
            className="h-full w-full"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            title="Song"
          />
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

