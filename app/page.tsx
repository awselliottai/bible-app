const bibleEndpoints = [
  {
    label: "Versions",
    href: "/api/bible/versions",
    description: "Normalized translation metadata from the active provider.",
  },
  {
    label: "Books",
    href: "/api/bible/BSB/books",
    description: "Old and New Testament book listing with chapter counts.",
  },
  {
    label: "Chapter",
    href: "/api/bible/BSB/JHN/3",
    description: "Chapter pagination unit with verses and previous/next pointers.",
  },
  {
    label: "Search",
    href: "/api/bible/search?version=BSB&q=love&limit=10",
    description: "Provider-backed text search for reader navigation.",
  },
];

export default function Home() {
  console.log("[page:home] rendering Bible app backend framework index");

  return (
    <main className="min-h-screen bg-[#f7f4ed] text-[#1d1b16]">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-10 sm:px-8 lg:px-10">
        <header className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#7a4f2a]">
            Bible Reader Framework
          </p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl">
            Backend-first scripture data architecture
          </h1>
          <p className="mt-5 text-lg leading-8 text-[#5b554b]">
            Provider-normalized versions, books, chapters, chapter pagination,
            search, and an AI study route are ready for a reader-centric
            frontend.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          {bibleEndpoints.map((endpoint) => (
            <a
              className="rounded-lg border border-[#d9ccb7] bg-white p-5 shadow-sm transition hover:border-[#9f7344]"
              href={endpoint.href}
              key={endpoint.href}
            >
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold">{endpoint.label}</h2>
                <code className="rounded bg-[#f0e7d8] px-2 py-1 text-xs text-[#5f3d1e]">
                  GET
                </code>
              </div>
              <p className="mt-3 text-sm leading-6 text-[#625b51]">
                {endpoint.description}
              </p>
              <p className="mt-4 break-all font-mono text-sm text-[#7a4f2a]">
                {endpoint.href}
              </p>
            </a>
          ))}
        </div>

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-lg border border-[#d9ccb7] bg-[#fffaf2] p-5">
            <h2 className="text-lg font-semibold">Reader Route Shape</h2>
            <p className="mt-3 font-mono text-sm text-[#7a4f2a]">
              /read/[version]/[book]/[chapter]
            </p>
            <p className="mt-3 text-sm leading-6 text-[#625b51]">
              Chapters are the canonical page unit for cacheability, stable
              links, and previous/next navigation.
            </p>
          </div>
          <div className="rounded-lg border border-[#d9ccb7] bg-[#fffaf2] p-5">
            <h2 className="text-lg font-semibold">Provider Boundary</h2>
            <p className="mt-3 text-sm leading-6 text-[#625b51]">
              The app currently uses Free Use Bible API through a normalized
              provider interface that can later swap to local JSON, SQLite,
              API.Bible, YouVersion, or ESV providers.
            </p>
          </div>
          <div className="rounded-lg border border-[#d9ccb7] bg-[#fffaf2] p-5">
            <h2 className="text-lg font-semibold">AI Route</h2>
            <p className="mt-3 font-mono text-sm text-[#7a4f2a]">
              POST /api/ai/study
            </p>
            <p className="mt-3 text-sm leading-6 text-[#625b51]">
              Vercel AI SDK streaming is wired for passage-grounded study
              responses when OPENAI_API_KEY is configured.
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}
