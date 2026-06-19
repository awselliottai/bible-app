import "server-only";
import {
  BibleProviderError,
  type BibleBook,
  type BibleChapter,
  type BibleProvider,
  type BibleSearchResult,
  type BibleVersion,
  type Testament,
} from "../types";
import { apiBibleFetch, hasApiBibleCredentials } from "./apiBibleFetch";

const OLD_TESTAMENT_BOOKS = new Set([
  "GEN",
  "EXO",
  "LEV",
  "NUM",
  "DEU",
  "JOS",
  "JDG",
  "RUT",
  "1SA",
  "2SA",
  "1KI",
  "2KI",
  "1CH",
  "2CH",
  "EZR",
  "NEH",
  "EST",
  "JOB",
  "PSA",
  "PRO",
  "ECC",
  "SNG",
  "ISA",
  "JER",
  "LAM",
  "EZK",
  "DAN",
  "HOS",
  "JOL",
  "AMO",
  "OBA",
  "JON",
  "MIC",
  "NAM",
  "HAB",
  "ZEP",
  "HAG",
  "ZEC",
  "MAL",
]);

const NEW_TESTAMENT_BOOKS = new Set([
  "MAT",
  "MRK",
  "LUK",
  "JHN",
  "ACT",
  "ROM",
  "1CO",
  "2CO",
  "GAL",
  "EPH",
  "PHP",
  "COL",
  "1TH",
  "2TH",
  "1TI",
  "2TI",
  "TIT",
  "PHM",
  "HEB",
  "JAS",
  "1PE",
  "2PE",
  "1JN",
  "2JN",
  "3JN",
  "JUD",
  "REV",
]);

const LICENSED_ALIAS_HINTS = new Set([
  "ESV",
  "NIV",
  "NLT",
  "NKJV",
  "NASB",
  "CSB",
]);

type ApiBibleResponse<T> = {
  data: T;
  meta?: ApiBibleMeta;
};

type ApiBibleMeta = {
  fumsId?: string;
  fumsJsInclude?: string;
  fumsJs?: string;
};

type ApiBibleVersion = {
  id: string;
  abbreviation: string;
  abbreviationLocal?: string;
  name: string;
  nameLocal?: string;
  description?: string;
  language: {
    id: string;
    name: string;
    scriptDirection?: string;
  };
  copyright?: string;
};

type ApiBibleBook = {
  id: string;
  bibleId: string;
  abbreviation?: string;
  name: string;
  nameLong?: string;
  chapters?: Array<{
    id: string;
    number: string;
    reference?: string;
  }>;
};

type ApiBibleChapter = {
  id: string;
  bibleId: string;
  bookId: string;
  number: string;
  reference: string;
  content?: unknown;
  copyright?: string;
  next?: ApiBibleChapterPointer;
  previous?: ApiBibleChapterPointer;
};

type ApiBibleChapterPointer = {
  id?: string;
  number?: string;
  bookId?: string;
};

type ApiBibleSearchData = {
  query: string;
  limit?: number;
  offset?: number;
  total?: number;
  verseCount?: number;
  verses?: Array<{
    id: string;
    bibleId: string;
    bookId: string;
    chapterId: string;
    reference: string;
    text: string;
  }>;
};

function textDirection(scriptDirection?: string): "ltr" | "rtl" | undefined {
  if (scriptDirection === "RTL" || scriptDirection === "rtl") {
    return "rtl";
  }

  if (scriptDirection === "LTR" || scriptDirection === "ltr") {
    return "ltr";
  }

  return undefined;
}

function normalizeAlias(value: string) {
  return value.trim().toUpperCase();
}

function toVersion(bible: ApiBibleVersion): BibleVersion {
  const abbreviation = bible.abbreviation || bible.abbreviationLocal || bible.id;

  return {
    id: abbreviation,
    abbreviation,
    name: bible.name,
    source: "api-bible",
    language: bible.language.id,
    languageName: bible.language.name,
    textDirection: textDirection(bible.language.scriptDirection),
    licenseNotice: bible.copyright,
    providerId: bible.id,
  };
}

function orderForBook(bookId: string) {
  const canonical = [...OLD_TESTAMENT_BOOKS, ...NEW_TESTAMENT_BOOKS];
  const index = canonical.indexOf(bookId);
  return index === -1 ? canonical.length + 1 : index + 1;
}

function testamentForBook(bookId: string): Testament {
  if (NEW_TESTAMENT_BOOKS.has(bookId)) {
    return "new";
  }

  return "old";
}

function isReaderChapter(chapter: { id: string; number: string }) {
  return !chapter.id.toLocaleLowerCase().includes("intro") && /^\d+$/.test(chapter.number);
}

function toBook(book: ApiBibleBook): BibleBook {
  const chapters = book.chapters?.filter(isReaderChapter) ?? [];

  return {
    id: book.id,
    name: book.nameLong || book.name,
    testament: testamentForBook(book.id),
    order: orderForBook(book.id),
    chapters: chapters.length,
  };
}

function parseChapterNumber(value?: string) {
  if (!value) {
    return undefined;
  }

  const lastPart = value.split(".").at(-1);
  const parsed = Number(lastPart);
  return Number.isInteger(parsed) ? parsed : undefined;
}

function pointerFromApi(pointer?: ApiBibleChapterPointer) {
  const chapter = parseChapterNumber(pointer?.id ?? pointer?.number);

  if (!pointer?.bookId || !chapter) {
    return undefined;
  }

  return {
    bookId: pointer.bookId,
    chapter,
  };
}

function textFromUnknownContent(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(textFromUnknownContent).join(" ");
  }

  if (typeof value === "object" && value !== null) {
    const record = value as Record<string, unknown>;

    if (typeof record.text === "string") {
      return record.text;
    }

    if (typeof record.content === "string") {
      return record.content;
    }

    if (Array.isArray(record.items)) {
      return textFromUnknownContent(record.items);
    }

    if (Array.isArray(record.children)) {
      return textFromUnknownContent(record.children);
    }
  }

  return "";
}

function stripTags(value: string) {
  return value.replace(/<[^>]*>/g, " ");
}

function plainText(value: unknown) {
  return stripTags(textFromUnknownContent(value)).replace(/\s+/g, " ").trim();
}

function versesFromContent(content: unknown) {
  const text = plainText(content);

  if (!text) {
    return [];
  }

  return [
    {
      number: 1,
      text,
    },
  ];
}

function contentHtml(content: unknown) {
  return typeof content === "string" && content.includes("<") ? content : undefined;
}

function contentBlocks(content: unknown) {
  return Array.isArray(content) ? content : undefined;
}

function toChapter(
  requestedVersionId: string,
  chapterNumber: number,
  response: ApiBibleResponse<ApiBibleChapter>,
): BibleChapter {
  const chapter = response.data;

  return {
    versionId: requestedVersionId,
    bookId: chapter.bookId,
    chapter: chapterNumber,
    reference: chapter.reference,
    verses: versesFromContent(chapter.content),
    contentHtml: contentHtml(chapter.content),
    contentBlocks: contentBlocks(chapter.content),
    previous: pointerFromApi(chapter.previous),
    next: pointerFromApi(chapter.next),
    copyright: chapter.copyright,
    fums: {
      fumsId: response.meta?.fumsId,
      fumsJsInclude: response.meta?.fumsJsInclude,
      fumsJs: response.meta?.fumsJs,
    },
    source: "api-bible",
  };
}

function clampLimit(limit?: number) {
  if (!limit || Number.isNaN(limit)) {
    return 25;
  }

  return Math.min(Math.max(limit, 1), 100);
}

async function listApiBibleVersions() {
  const response = await apiBibleFetch<ApiBibleResponse<ApiBibleVersion[]>>("/bibles");
  const versions = response.data.map(toVersion);
  console.log("[bible:api-bible] normalized versions", versions.length);
  return versions;
}

async function resolveBibleId(versionId: string) {
  const versions = await listApiBibleVersions();
  const normalized = normalizeAlias(versionId);
  const match = versions.find((version) => {
    return (
      normalizeAlias(version.id) === normalized ||
      normalizeAlias(version.abbreviation) === normalized ||
      version.providerId === versionId
    );
  });

  if (!match?.providerId) {
    throw new BibleProviderError(
      `API.Bible version is not available for this API key: ${versionId}`,
      404,
    );
  }

  return match.providerId;
}

export function mayBeApiBibleVersion(versionId: string) {
  return LICENSED_ALIAS_HINTS.has(normalizeAlias(versionId));
}

export const apiBibleProvider: BibleProvider = {
  async listVersions() {
    if (!hasApiBibleCredentials()) {
      console.log("[bible:api-bible] skipped versions; missing API key");
      return [];
    }

    return listApiBibleVersions();
  },

  async listBooks(versionId: string) {
    const bibleId = await resolveBibleId(versionId);
    const response = await apiBibleFetch<ApiBibleResponse<ApiBibleBook[]>>(
      `/bibles/${encodeURIComponent(bibleId)}/books?include-chapters=true`,
    );
    const books = response.data.map(toBook).filter((book) => book.chapters > 0);
    console.log("[bible:api-bible] normalized books", versionId, books.length);
    return books;
  },

  async getChapter(versionId: string, bookId: string, chapter: number) {
    if (!Number.isInteger(chapter) || chapter < 1) {
      throw new BibleProviderError("Chapter must be a positive integer.", 400);
    }

    const bibleId = await resolveBibleId(versionId);
    const chapterId = `${bookId}.${chapter}`;
    const params = new URLSearchParams({
      "content-type": "json",
      "include-notes": "false",
      "include-titles": "true",
      "include-chapter-numbers": "false",
      "include-verse-numbers": "true",
      "include-verse-spans": "true",
    });
    const response = await apiBibleFetch<ApiBibleResponse<ApiBibleChapter>>(
      `/bibles/${encodeURIComponent(bibleId)}/chapters/${encodeURIComponent(chapterId)}?${params}`,
      {
        next: {
          revalidate: 60 * 15,
        },
      },
    );
    const normalized = toChapter(versionId, chapter, response);
    console.log("[bible:api-bible] normalized chapter", normalized.reference);
    return normalized;
  },

  async search(versionId: string, query: string, options) {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 2) {
      throw new BibleProviderError("Search query must be at least 2 characters.", 400);
    }

    const bibleId = await resolveBibleId(versionId);
    const params = new URLSearchParams({
      query: trimmedQuery,
      limit: String(clampLimit(options?.limit)),
      offset: String(options?.offset ?? 0),
    });
    const response = await apiBibleFetch<ApiBibleResponse<ApiBibleSearchData>>(
      `/bibles/${encodeURIComponent(bibleId)}/search?${params}`,
      {
        next: {
          revalidate: 0,
        },
      },
    );
    const results: BibleSearchResult[] =
      response.data.verses?.map((verse) => ({
        versionId,
        bookId: verse.bookId,
        bookName: verse.reference.split(" ")[0] ?? verse.bookId,
        chapter: parseChapterNumber(verse.chapterId) ?? 1,
        verse: parseChapterNumber(verse.id) ?? 1,
        reference: verse.reference,
        text: stripTags(verse.text).replace(/\s+/g, " ").trim(),
      })) ?? [];

    console.log("[bible:api-bible] search results", versionId, results.length);
    return {
      query: trimmedQuery,
      versionId,
      resultCount: response.data.total ?? response.data.verseCount ?? results.length,
      results,
      searchedScope: "provider-search",
    };
  },
};
