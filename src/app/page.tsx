import Image from "next/image";

export default function Home() {
  return (
    <div className="grid gap-8">
      <section className="rounded-2xl border border-black/10 bg-white p-8 shadow-sm dark:border-white/15 dark:bg-black">
        <div className="flex items-center justify-between gap-6">
          <div className="max-w-2xl">
            <h1 className="text-balance text-4xl font-semibold tracking-tight">
              Make a music e-card with a GIF.
            </h1>
            <p className="mt-3 text-pretty text-base text-black/70 dark:text-white/70">
              Search for a Spotify track or YouTube video, pair it with a GIPHY
              GIF (or your own photo), add a short note, and share a short link.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                href="/create"
                className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-5 text-sm font-medium text-background hover:opacity-90"
              >
                Create an e-card
              </a>
              <a
                href="/create"
                className="inline-flex h-11 items-center justify-center rounded-full border border-black/10 px-5 text-sm font-medium hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
              >
                Try a quick demo
              </a>
            </div>
          </div>
          <div className="hidden shrink-0 md:block">
            <div className="relative h-20 w-40">
              <Image
                className="dark:invert"
                src="/next.svg"
                alt="Next.js logo"
                fill
                sizes="160px"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            title: "1) Pick a song",
            desc: "Search Spotify or YouTube and select a result.",
          },
          {
            title: "2) Add a GIF or photo",
            desc: "Search GIPHY or upload an image.",
          },
          {
            title: "3) Share a short link",
            desc: "We generate a short URL that renders your card.",
          },
        ].map((x) => (
          <div
            key={x.title}
            className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/15 dark:bg-black"
          >
            <div className="text-sm font-semibold">{x.title}</div>
            <div className="mt-2 text-sm text-black/70 dark:text-white/70">
              {x.desc}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
