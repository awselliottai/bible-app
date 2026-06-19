import Link from "next/link";
import { listBibleVersions } from "@/app/lib/bible/provider";
import type { BibleVersion } from "@/app/lib/bible/types";

export const dynamic = "force-dynamic";

const oldTestamentBooks = [
  "Genesis",
  "Exodus",
  "Leviticus",
  "Numbers",
  "Deuteronomy",
  "Joshua",
  "Judges",
  "Ruth",
  "1 Samuel",
  "2 Samuel",
  "1 Kings",
  "2 Kings",
  "Psalms",
  "Proverbs",
  "Isaiah",
  "Jeremiah",
  "Daniel",
  "Malachi",
];

const newTestamentBooks = [
  "Matthew",
  "Mark",
  "Luke",
  "John",
  "Acts",
  "Romans",
  "1 Corinthians",
  "2 Corinthians",
  "Galatians",
  "Ephesians",
  "Philippians",
  "Hebrews",
  "James",
  "1 Peter",
  "1 John",
  "Revelation",
];

const johnChapters = Array.from({ length: 21 }, (_, index) => index + 1);

function prioritizeVersions(versions: BibleVersion[]) {
  const preferred = new Set(["BSB", "KJV", "WEB", "ASV", "ESV", "NIV", "NLT"]);
  const sorted = [...versions].sort((first, second) => {
    const firstPreferred = preferred.has(first.abbreviation.toUpperCase()) ? 0 : 1;
    const secondPreferred = preferred.has(second.abbreviation.toUpperCase()) ? 0 : 1;

    if (firstPreferred !== secondPreferred) {
      return firstPreferred - secondPreferred;
    }

    return first.abbreviation.localeCompare(second.abbreviation);
  });

  return sorted.slice(0, 12);
}

export default async function Home() {
  console.log("[page:home] rendering general Bible access view");
  const versions = prioritizeVersions(await listBibleVersions());
  const defaultVersion =
    versions.find((version) => version.abbreviation === "BSB") ?? versions[0];
  const defaultVersionId = defaultVersion?.id ?? "BSB";

  return (
    <main className="min-h-screen bg-[#fbfaf7] text-[#1f201b]">
      <section className="border-b border-[#dfd8c9] bg-[#f1eee6]">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-6 sm:px-8 lg:px-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#6f5336]">
                Scripture Reader
              </p>
              <h1 className="mt-2 text-4xl font-semibold tracking-normal sm:text-5xl">
                Bible
              </h1>
            </div>

            <form
              action="/api/bible/search"
              className="flex w-full flex-col gap-3 rounded-lg border border-[#d7ccb8] bg-white p-3 shadow-sm sm:flex-row lg:max-w-2xl"
              method="get"
            >
              <label className="sr-only" htmlFor="version">
                Version
              </label>
              <select
                className="h-11 rounded-md border border-[#d7ccb8] bg-[#fbfaf7] px-3 text-sm font-medium"
                defaultValue={defaultVersionId}
                id="version"
                name="version"
              >
                {versions.map((version) => (
                  <option key={`${version.source}:${version.id}`} value={version.id}>
                    {version.abbreviation}
                  </option>
                ))}
              </select>

              <label className="sr-only" htmlFor="query">
                Search
              </label>
              <input
                className="h-11 min-w-0 flex-1 rounded-md border border-[#d7ccb8] px-3 text-base outline-none focus:border-[#8f6b43]"
                defaultValue="love"
                id="query"
                name="q"
                placeholder="Search words or phrases"
                type="search"
              />
              <input name="limit" type="hidden" value="20" />
              <button className="h-11 rounded-md bg-[#33433a] px-5 text-sm font-semibold text-white transition hover:bg-[#28362f]">
                Search
              </button>
            </form>
          </div>

          <nav className="flex flex-wrap gap-2" aria-label="Bible versions">
            {versions.map((version) => (
              <a
                className="rounded-md border border-[#d7ccb8] bg-white px-3 py-2 text-sm font-semibold text-[#55442f] transition hover:border-[#8f6b43]"
                href={`/api/bible/${version.id}/books`}
                key={`${version.source}:${version.id}`}
              >
                {version.abbreviation}
              </a>
            ))}
          </nav>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[280px_minmax(0,1fr)_320px] lg:px-10">
        <aside className="flex flex-col gap-6">
          <section>
            <div className="flex items-center justify-between border-b border-[#dfd8c9] pb-2">
              <h2 className="text-lg font-semibold">Old Testament</h2>
              <span className="text-sm text-[#766d60]">39</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-1">
              {oldTestamentBooks.map((book) => (
                <button
                  className="rounded-md px-2 py-2 text-left text-sm font-medium text-[#3f3d35] transition hover:bg-[#efe8dc]"
                  key={book}
                >
                  {book}
                </button>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between border-b border-[#dfd8c9] pb-2">
              <h2 className="text-lg font-semibold">New Testament</h2>
              <span className="text-sm text-[#766d60]">27</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-1">
              {newTestamentBooks.map((book) => (
                <button
                  className="rounded-md px-2 py-2 text-left text-sm font-medium text-[#3f3d35] transition hover:bg-[#efe8dc]"
                  key={book}
                >
                  {book}
                </button>
              ))}
            </div>
          </section>
        </aside>

        <article className="rounded-lg border border-[#dfd8c9] bg-white shadow-sm">
          <header className="flex flex-col gap-4 border-b border-[#dfd8c9] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#6f5336]">
                BSB
              </p>
              <h2 className="mt-1 text-3xl font-semibold">John 3</h2>
            </div>
            <div className="flex gap-2">
              <Link
                className="rounded-md border border-[#d7ccb8] px-3 py-2 text-sm font-semibold text-[#55442f] transition hover:border-[#8f6b43]"
                href="/api/bible/BSB/JHN/2"
              >
                Previous
              </Link>
              <Link
                className="rounded-md border border-[#d7ccb8] px-3 py-2 text-sm font-semibold text-[#55442f] transition hover:border-[#8f6b43]"
                href="/api/bible/BSB/JHN/4"
              >
                Next
              </Link>
            </div>
          </header>

          <div className="space-y-5 p-5 text-lg leading-8 text-[#2e3029]">
            <p>
              <sup className="mr-1 text-sm font-semibold text-[#8a6a45]">1</sup>
              Now there was a man of the Pharisees named Nicodemus, a leader of
              the Jews.
            </p>
            <p>
              <sup className="mr-1 text-sm font-semibold text-[#8a6a45]">2</sup>
              He came to Jesus at night and said, &quot;Rabbi, we know that You
              are a teacher who has come from God.&quot;
            </p>
            <p>
              <sup className="mr-1 text-sm font-semibold text-[#8a6a45]">3</sup>
              Jesus replied, &quot;Truly, truly, I tell you, no one can see the
              kingdom of God unless he is born again.&quot;
            </p>
            <p>
              <sup className="mr-1 text-sm font-semibold text-[#8a6a45]">16</sup>
              For God so loved the world that He gave His one and only Son, that
              everyone who believes in Him shall not perish but have eternal
              life.
            </p>
          </div>
        </article>

        <aside className="flex flex-col gap-6">
          <section className="rounded-lg border border-[#dfd8c9] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">John</h2>
            <div className="mt-4 grid grid-cols-7 gap-2">
              {johnChapters.map((chapter) => (
                <Link
                  className="flex aspect-square items-center justify-center rounded-md border border-[#d7ccb8] text-sm font-semibold text-[#55442f] transition hover:border-[#8f6b43] hover:bg-[#f5efe5]"
                  href={`/api/bible/BSB/JHN/${chapter}`}
                  key={chapter}
                >
                  {chapter}
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-[#dfd8c9] bg-[#eef3ef] p-5">
            <h2 className="text-lg font-semibold">Continue</h2>
            <Link
              className="mt-4 block rounded-md bg-[#33433a] px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#28362f]"
              href="/api/bible/BSB/JHN/3"
            >
              Open John 3
            </Link>
          </section>
        </aside>
      </section>
    </main>
  );
}
