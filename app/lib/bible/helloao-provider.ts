import type {
  ApiAvailableTranslations,
  ApiTranslation,
  ApiTranslationBook,
  ApiTranslationBookChapter,
  ApiTranslationComplete,
  ChapterContent,
  ChapterVerse,
  FormattedText,
  InlineHeading,
  InlineLineBreak,
  VerseFootnoteReference,
} from "free-use-bible-api";
import {
  BibleProviderError,
  type BibleBook,
  type BibleChapter,
  type BibleProvider,
  type BibleSearchResponse,
  type BibleSearchResult,
  type BibleVersion,
  type Testament,
} from "./types";

const DEFAULT_ENDPOINT = "https://bible.helloao.org";
const OLD_TESTAMENT_BOOKS = 39;

type TranslationBooksResponse = {
  translation: ApiTranslation;
  books: ApiTranslationBook[];
};

function endpoint() {
  return process.env.HELLOAO_BIBLE_API_ENDPOINT ?? DEFAULT_ENDPOINT;
}

function normalizePath(path: string) {
  return `${endpoint().replace(/\/$/, "")}${path}`;
}

async function getJson<T>(path: string, init?: RequestInit): Promise<T> {
  const url = normalizePath(path);
  console.log("[bible:helloao] fetch", url);

  const response = await fetch(url, {
    ...init,
    headers: {
      accept: "application/json",
      ...init?.headers,
    },
    next: {
      revalidate: 60 * 60 * 24,
      ...init?.next,
    },
  });

  if (!response.ok) {
    console.log("[bible:helloao] fetch failed", response.status, url);
    throw new BibleProviderError(
      `Bible API request failed with ${response.status}`,
      response.status,
    );
  }

  return response.json() as Promise<T>;
}

function toVersion(translation: ApiTranslation): BibleVersion {
  return {
    id: translation.id,
    abbreviation: translation.shortName ?? translation.id,
    name: translation.englishName || translation.name,
    source: "helloao",
    language: translation.language,
    languageName: translation.languageEnglishName ?? translation.languageName,
    textDirection: translation.textDirection,
    licenseLabel: translation.licenseNotes ?? undefined,
    licenseUrl: translation.licenseUrl,
    licenseNotice: translation.licenseNotice ?? undefined,
    numberOfBooks: translation.numberOfBooks,
    totalNumberOfChapters: translation.totalNumberOfChapters,
  };
}

function testamentForBook(book: ApiTranslationBook): Testament {
  if (book.isApocryphal) {
    return "old";
  }

  return book.order <= OLD_TESTAMENT_BOOKS ? "old" : "new";
}

function toBook(book: ApiTranslationBook): BibleBook {
  return {
    id: book.id,
    name: book.commonName || book.name,
    testament: testamentForBook(book),
    order: book.order,
    chapters: book.numberOfChapters,
    isApocryphal: book.isApocryphal,
  };
}

function isFormattedText(value: unknown): value is FormattedText {
  return typeof value === "object" && value !== null && "text" in value;
}

function isInlineHeading(value: unknown): value is InlineHeading {
  return typeof value === "object" && value !== null && "heading" in value;
}

function isInlineLineBreak(value: unknown): value is InlineLineBreak {
  return typeof value === "object" && value !== null && "lineBreak" in value;
}

function isFootnoteReference(value: unknown): value is VerseFootnoteReference {
  return typeof value === "object" && value !== null && "noteId" in value;
}

function textFromContent(
  content: Array<
    string | FormattedText | InlineHeading | InlineLineBreak | VerseFootnoteReference
  >,
) {
  return content
    .map((entry) => {
      if (typeof entry === "string") {
        return entry;
      }

      if (isFormattedText(entry)) {
        return entry.text;
      }

      if (isInlineHeading(entry)) {
        return entry.heading;
      }

      if (isInlineLineBreak(entry)) {
        return " ";
      }

      if (isFootnoteReference(entry)) {
        return " ";
      }

      return "";
    })
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

function verseFromContent(content: ChapterContent): ChapterVerse | null {
  return content.type === "verse" ? content : null;
}

function toChapter(chapter: ApiTranslationBookChapter): BibleChapter {
  const verses = chapter.chapter.content
    .map(verseFromContent)
    .filter((verse): verse is ChapterVerse => verse !== null)
    .map((verse) => ({
      number: verse.number,
      text: textFromContent(verse.content),
    }));

  return {
    versionId: chapter.translation.id,
    bookId: chapter.book.id,
    chapter: chapter.chapter.number,
    reference: `${chapter.book.commonName || chapter.book.name} ${chapter.chapter.number}`,
    verses,
    previous: chapter.previousChapterReference
      ? {
          bookId: chapter.previousChapterReference.book,
          chapter: chapter.previousChapterReference.chapter,
        }
      : undefined,
    next: chapter.nextChapterReference
      ? {
          bookId: chapter.nextChapterReference.book,
          chapter: chapter.nextChapterReference.chapter,
        }
      : undefined,
    copyright:
      chapter.translation.licenseNotice ??
      chapter.translation.licenseNotes ??
      undefined,
    source: "helloao",
  };
}

function clampLimit(limit?: number) {
  if (!limit || Number.isNaN(limit)) {
    return 25;
  }

  return Math.min(Math.max(limit, 1), 100);
}

function searchCompleteTranslation(
  complete: ApiTranslationComplete,
  query: string,
  limit: number,
): BibleSearchResult[] {
  const normalizedQuery = query.toLocaleLowerCase();
  const results: BibleSearchResult[] = [];

  for (const book of complete.books) {
    for (const chapter of book.chapters) {
      for (const content of chapter.chapter.content) {
        const verse = verseFromContent(content);

        if (!verse) {
          continue;
        }

        const text = textFromContent(verse.content);

        if (!text.toLocaleLowerCase().includes(normalizedQuery)) {
          continue;
        }

        results.push({
          versionId: complete.translation.id,
          bookId: book.id,
          bookName: book.commonName || book.name,
          chapter: chapter.chapter.number,
          verse: verse.number,
          reference: `${book.commonName || book.name} ${chapter.chapter.number}:${verse.number}`,
          text,
        });

        if (results.length >= limit) {
          return results;
        }
      }
    }
  }

  return results;
}

export const helloAoBibleProvider: BibleProvider = {
  async listVersions() {
    const data = await getJson<ApiAvailableTranslations>(
      "/api/available_translations.json",
    );
    const versions = data.translations.map(toVersion);
    console.log("[bible:helloao] normalized versions", versions.length);
    return versions;
  },

  async listBooks(versionId: string) {
    const data = await getJson<TranslationBooksResponse>(
      `/api/${encodeURIComponent(versionId)}/books.json`,
    );
    const books = data.books.map(toBook);
    console.log("[bible:helloao] normalized books", versionId, books.length);
    return books;
  },

  async getChapter(versionId: string, bookId: string, chapter: number) {
    if (!Number.isInteger(chapter) || chapter < 1) {
      throw new BibleProviderError("Chapter must be a positive integer.", 400);
    }

    const data = await getJson<ApiTranslationBookChapter>(
      `/api/${encodeURIComponent(versionId)}/${encodeURIComponent(bookId)}/${chapter}.json`,
    );
    const normalized = toChapter(data);
    console.log("[bible:helloao] normalized chapter", normalized.reference);
    return normalized;
  },

  async search(versionId: string, query: string, options) {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 2) {
      throw new BibleProviderError("Search query must be at least 2 characters.", 400);
    }

    const limit = clampLimit(options?.limit);
    const complete = await getJson<ApiTranslationComplete>(
      `/api/${encodeURIComponent(versionId)}/complete.json`,
      {
        next: {
          revalidate: 60 * 60 * 24 * 7,
        },
      },
    );
    const results = searchCompleteTranslation(complete, trimmedQuery, limit);
    const response: BibleSearchResponse = {
      query: trimmedQuery,
      versionId,
      resultCount: results.length,
      results,
      searchedScope: "complete-translation",
    };

    console.log("[bible:helloao] search results", versionId, results.length);
    return response;
  },
};
