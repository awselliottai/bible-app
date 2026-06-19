import Link from "next/link";
import { ApiBibleFums } from "@/app/components/ApiBibleFums";
import { BibleStudyPanel } from "@/app/components/BibleStudyPanel";
import type {
  BibleBook,
  BibleChapter,
  BibleSearchResponse,
  BibleVersion,
} from "@/app/lib/bible/types";

type BibleReaderViewProps = {
  versions: BibleVersion[];
  selectedVersionId: string;
  books: BibleBook[];
  chapter: BibleChapter;
  searchQuery?: string;
  search?: BibleSearchResponse;
};

function versionLabel(version: BibleVersion) {
  return version.abbreviation || version.id;
}

function versionName(versions: BibleVersion[], versionId: string) {
  const version = versions.find((entry) => entry.id === versionId);
  return version ? versionLabel(version) : versionId;
}

function hrefForChapter(versionId: string, bookId: string, chapter: number) {
  return `/read/${encodeURIComponent(versionId)}/${encodeURIComponent(bookId)}/${chapter}`;
}

function booksByTestament(books: BibleBook[], testament: BibleBook["testament"]) {
  return books
    .filter((book) => book.testament === testament)
    .sort((first, second) => first.order - second.order);
}

function activeBook(books: BibleBook[], chapter: BibleChapter) {
  return books.find((book) => book.id === chapter.bookId);
}

function chapterNumbers(book?: BibleBook) {
  return Array.from({ length: book?.chapters ?? 0 }, (_, index) => index + 1);
}

function ReaderHeader({
  versions,
  selectedVersionId,
  searchQuery,
}: {
  versions: BibleVersion[];
  selectedVersionId: string;
  searchQuery?: string;
}) {
  console.log("[component:BibleReaderView] rendering reader header", selectedVersionId);

  return (
    <section className="app-header border-b">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 pr-20 sm:px-8 sm:pr-24 sm:py-6 lg:px-10 lg:pr-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <Link
              className="app-link text-sm font-semibold uppercase tracking-normal transition"
              href="/"
            >
              Scripture Reader
            </Link>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal sm:text-4xl lg:text-5xl">
              Bible
            </h1>
          </div>

          <form
            action="/search"
            className="app-card flex w-full min-w-0 flex-col gap-3 rounded-lg border p-3 sm:flex-row lg:max-w-2xl"
            method="get"
            role="search"
          >
            <label className="sr-only" htmlFor="version">
              Version
            </label>
            <select
              className="app-control h-11 rounded-md border px-3 text-sm font-medium"
              defaultValue={selectedVersionId}
              id="version"
              name="version"
            >
              {versions.map((version) => (
                <option key={`${version.source}:${version.id}`} value={version.id}>
                  {versionLabel(version)}
                </option>
              ))}
            </select>

            <label className="sr-only" htmlFor="query">
              Search
            </label>
            <input
              className="app-control h-11 min-w-0 flex-1 rounded-md border px-3 text-base outline-none transition"
              defaultValue={searchQuery}
              id="query"
              name="q"
              placeholder="Search words or phrases"
              type="search"
            />
            <input name="limit" type="hidden" value="20" />
            <button
              className="app-button-primary h-11 w-full rounded-md px-5 text-sm font-semibold transition sm:w-auto"
              type="submit"
            >
              Search
            </button>
          </form>
        </div>

        <nav
          aria-label="Quick version switcher"
          className="version-nav hidden flex-wrap gap-2 lg:flex"
        >
          {versions.map((version) => (
            <Link
              aria-current={version.id === selectedVersionId ? "page" : undefined}
              className={`rounded-md border px-3 py-2 text-sm font-semibold transition ${
                version.id === selectedVersionId
                  ? "app-pill-active"
                  : "app-pill"
              }`}
              href={`/read/${encodeURIComponent(version.id)}`}
              key={`${version.source}:${version.id}`}
            >
              {versionLabel(version)}
            </Link>
          ))}
        </nav>
      </div>
    </section>
  );
}

function BookList({
  books,
  selectedVersionId,
  selectedBookId,
  testament,
  title,
}: {
  books: BibleBook[];
  selectedVersionId: string;
  selectedBookId: string;
  testament: BibleBook["testament"];
  title: string;
}) {
  const testamentBooks = booksByTestament(books, testament);

  return (
    <section aria-labelledby={`book-list-${testament}`}>
      <div className="app-divider flex items-center justify-between border-b pb-2">
        <h2 className="text-base font-semibold sm:text-lg" id={`book-list-${testament}`}>
          {title}
        </h2>
        <span className="app-muted text-sm">{testamentBooks.length}</span>
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1">
        {testamentBooks.map((book) => (
          <li key={book.id}>
            <Link
              aria-current={book.id === selectedBookId ? "page" : undefined}
              className={`block min-h-11 rounded-md px-2 py-2.5 text-left text-sm font-medium transition ${
                book.id === selectedBookId
                  ? "book-link-active"
                  : "book-link"
              }`}
              href={hrefForChapter(selectedVersionId, book.id, 1)}
            >
              {book.name}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ChapterBody({ chapter }: { chapter: BibleChapter }) {
  if (chapter.contentHtml) {
    return (
      <div
        data-bible-passage
        className="bible-content-html scripture-body space-y-5 p-4 text-base leading-7 sm:p-5 sm:text-lg sm:leading-8"
        dangerouslySetInnerHTML={{ __html: chapter.contentHtml }}
      />
    );
  }

  return (
    <div
      className="scripture-body space-y-5 p-4 text-base leading-7 sm:p-5 sm:text-lg sm:leading-8"
      data-bible-passage
    >
      {chapter.verses.map((verse) => (
        <p key={`${chapter.reference}:${verse.number}`}>
          <sup className="verse-number mr-1 text-sm font-semibold">
            {verse.number}
          </sup>
          {verse.text}
        </p>
      ))}
    </div>
  );
}

function ChapterNavigation({
  chapter,
  selectedVersionId,
}: {
  chapter: BibleChapter;
  selectedVersionId: string;
}) {
  if (!chapter.previous && !chapter.next) {
    return null;
  }

  console.log("[component:BibleReaderView] rendering lower chapter navigation", {
    reference: chapter.reference,
  });

  return (
    <nav
      aria-label="Chapter navigation"
      className="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:justify-between"
    >
      {chapter.previous ? (
        <Link
          className="app-button-secondary flex min-h-11 items-center justify-center rounded-md border px-4 py-3 text-center text-sm font-semibold transition sm:flex-1 lg:flex-none"
          href={hrefForChapter(
            selectedVersionId,
            chapter.previous.bookId,
            chapter.previous.chapter,
          )}
        >
          Previous chapter
        </Link>
      ) : (
        <span className="hidden sm:block sm:flex-1 lg:hidden" />
      )}
      {chapter.next ? (
        <Link
          className="app-button-secondary flex min-h-11 items-center justify-center rounded-md border px-4 py-3 text-center text-sm font-semibold transition sm:flex-1 lg:flex-none"
          href={hrefForChapter(
            selectedVersionId,
            chapter.next.bookId,
            chapter.next.chapter,
          )}
        >
          Next chapter
        </Link>
      ) : null}
    </nav>
  );
}

function SearchResults({
  search,
  selectedVersionId,
}: {
  search?: BibleSearchResponse;
  selectedVersionId: string;
}) {
  if (!search) {
    return null;
  }

  console.log("[component:BibleReaderView] rendering search results", search.query);

  return (
    <section className="app-card rounded-lg border p-5">
      <div className="app-divider flex items-baseline justify-between gap-3 border-b pb-3">
        <h2 className="text-lg font-semibold">Search results</h2>
        <span className="app-muted text-sm">{search.resultCount}</span>
      </div>
      <div className="mt-4 space-y-4">
        {search.results.length > 0 ? (
          search.results.map((result) => (
            <Link
              className="search-result-link block min-h-11 rounded-md border p-3 transition"
              href={hrefForChapter(selectedVersionId, result.bookId, result.chapter)}
              key={`${result.reference}:${result.text}`}
            >
              <span className="app-eyebrow block text-sm font-semibold">
                {result.reference}
              </span>
              <span className="mt-1 block text-sm leading-6">
                {result.text}
              </span>
            </Link>
          ))
        ) : (
          <p className="app-muted text-sm leading-6">
            No matching verses were found for this search.
          </p>
        )}
      </div>
    </section>
  );
}

export function BibleReaderView({
  versions,
  selectedVersionId,
  books,
  chapter,
  searchQuery,
  search,
}: BibleReaderViewProps) {
  console.log("[component:BibleReaderView] rendering chapter", chapter.reference);
  const book = activeBook(books, chapter);
  const chapters = chapterNumbers(book);
  const selectedVersionLabel = versionName(versions, selectedVersionId);

  return (
    <main className="app-main min-h-screen">
      <ReaderHeader
        searchQuery={searchQuery}
        versions={versions}
        selectedVersionId={selectedVersionId}
      />

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-5 sm:px-8 sm:py-6 lg:grid-cols-[280px_minmax(0,1fr)_320px] lg:px-10">
        <aside
          aria-label="Book navigation"
          className="order-3 flex flex-col gap-6 lg:order-1"
        >
          <details className="book-nav-details app-card rounded-lg border p-4 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
            <summary className="flex min-h-11 items-center justify-between gap-3 text-base font-semibold lg:hidden">
              Browse books
              <span className="app-muted text-sm font-medium">Show / hide</span>
            </summary>
            <div className="book-nav-content mt-4 lg:mt-0">
              <BookList
                books={books}
                selectedBookId={chapter.bookId}
                selectedVersionId={selectedVersionId}
                testament="old"
                title="Old Testament"
              />
              <BookList
                books={books}
                selectedBookId={chapter.bookId}
                selectedVersionId={selectedVersionId}
                testament="new"
                title="New Testament"
              />
            </div>
          </details>
        </aside>

        <div className="order-1 flex min-w-0 flex-col gap-6 lg:order-2">
          <article
            className="app-card rounded-lg border"
            id="reader-content"
            tabIndex={-1}
          >
            <header className="app-divider flex flex-col gap-4 border-b p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="min-w-0">
                <p className="app-eyebrow text-sm font-semibold uppercase tracking-normal">
                  {selectedVersionLabel}
                </p>
                <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">
                  {chapter.reference}
                </h2>
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                {chapter.previous ? (
                  <Link
                    className="app-button-secondary flex min-h-11 items-center justify-center rounded-md border px-3 py-2 text-center text-sm font-semibold transition"
                    href={hrefForChapter(
                      selectedVersionId,
                      chapter.previous.bookId,
                      chapter.previous.chapter,
                    )}
                  >
                    Previous
                  </Link>
                ) : null}
                {chapter.next ? (
                  <Link
                    className="app-button-secondary flex min-h-11 items-center justify-center rounded-md border px-3 py-2 text-center text-sm font-semibold transition"
                    href={hrefForChapter(
                      selectedVersionId,
                      chapter.next.bookId,
                      chapter.next.chapter,
                    )}
                  >
                    Next
                  </Link>
                ) : null}
              </div>
            </header>

            <ChapterBody chapter={chapter} />

            {chapter.copyright ? (
              <footer className="app-divider app-muted border-t p-5 text-sm leading-6">
                {chapter.copyright}
              </footer>
            ) : null}
          </article>

          <ChapterNavigation
            chapter={chapter}
            selectedVersionId={selectedVersionId}
          />

          <SearchResults search={search} selectedVersionId={selectedVersionId} />
        </div>

        <aside
          aria-label="Chapter picker and study tools"
          className="order-2 flex flex-col gap-6 lg:order-3"
        >
          <section
            aria-labelledby="chapter-picker-heading"
            className="app-card rounded-lg border p-4 sm:p-5"
          >
            <h2 className="text-base font-semibold sm:text-lg" id="chapter-picker-heading">
              {book?.name ?? chapter.bookId}
            </h2>
            <nav aria-label={`Chapters in ${book?.name ?? chapter.bookId}`}>
              <ul className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-6 md:grid-cols-7">
                {chapters.map((chapterNumber) => (
                  <li key={chapterNumber}>
                    <Link
                      aria-current={
                        chapterNumber === chapter.chapter ? "page" : undefined
                      }
                      aria-label={`Chapter ${chapterNumber}`}
                      className={`chapter-chip flex aspect-square items-center justify-center rounded-md border text-sm font-semibold transition ${
                        chapterNumber === chapter.chapter
                          ? "chapter-chip-active"
                          : "chapter-chip"
                      }`}
                      href={hrefForChapter(
                        selectedVersionId,
                        chapter.bookId,
                        chapterNumber,
                      )}
                    >
                      {chapterNumber}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </section>

          <BibleStudyPanel
            bookId={chapter.bookId}
            chapter={chapter.chapter}
            reference={chapter.reference}
            versionId={selectedVersionId}
          />
        </aside>
      </section>

      <ApiBibleFums
        fumsJs={chapter.fums?.fumsJs}
        fumsJsInclude={chapter.fums?.fumsJsInclude}
      />
    </main>
  );
}
