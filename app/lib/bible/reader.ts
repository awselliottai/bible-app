import {
  listBibleVersions,
  resolveBibleProvider,
} from "@/app/lib/bible/provider";
import type {
  BibleBook,
  BibleChapter,
  BibleSearchResponse,
  BibleVersion,
} from "@/app/lib/bible/types";

export type ReaderData = {
  versions: BibleVersion[];
  selectedVersionId: string;
  books: BibleBook[];
  chapter: BibleChapter;
};

export function prioritizeVersions(versions: BibleVersion[]) {
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

export function defaultVersionId(versions: BibleVersion[]) {
  return versions.find((version) => version.abbreviation === "BSB")?.id ?? versions[0]?.id;
}

function firstReadableBook(books: BibleBook[]) {
  return [...books].sort((first, second) => first.order - second.order)[0];
}

function defaultBookId(books: BibleBook[]) {
  return books.find((book) => book.id === "JHN")?.id ?? firstReadableBook(books)?.id;
}

function defaultChapterForBook(book?: BibleBook) {
  if (!book) {
    return 1;
  }

  return book.id === "JHN" && book.chapters >= 3 ? 3 : 1;
}

export async function getReaderData(input?: {
  versionId?: string;
  bookId?: string;
  chapter?: number;
}): Promise<ReaderData> {
  console.log("[bible:reader] resolving reader data", input);
  const versions = prioritizeVersions(await listBibleVersions());
  const selectedVersionId = input?.versionId ?? defaultVersionId(versions) ?? "BSB";
  const provider = await resolveBibleProvider(selectedVersionId);
  const books = await provider.listBooks(selectedVersionId);
  const selectedBookId = input?.bookId ?? defaultBookId(books) ?? "JHN";
  const selectedBook = books.find((book) => book.id === selectedBookId);
  const selectedChapter = input?.chapter ?? defaultChapterForBook(selectedBook);
  const chapter = await provider.getChapter(
    selectedVersionId,
    selectedBookId,
    selectedChapter,
  );

  console.log("[bible:reader] resolved reader chapter", chapter.reference);

  return {
    versions,
    selectedVersionId,
    books,
    chapter,
  };
}

export async function searchBible(input: {
  versionId: string;
  query: string;
  limit?: number;
}): Promise<BibleSearchResponse | undefined> {
  const query = input.query.trim();

  if (query.length < 2) {
    console.log("[bible:reader] search skipped; query too short", query);
    return undefined;
  }

  const provider = await resolveBibleProvider(input.versionId);

  if (!provider.search) {
    console.log("[bible:reader] search skipped; provider has no search", input.versionId);
    return undefined;
  }

  console.log("[bible:reader] searching reader", input.versionId, query);
  return provider.search(input.versionId, query, {
    limit: input.limit,
  });
}
