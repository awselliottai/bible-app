export type Testament = "old" | "new";

export type BibleProviderSource =
  | "local"
  | "helloao"
  | "api-bible"
  | "youversion"
  | "esv";

export type BibleVersion = {
  id: string;
  abbreviation: string;
  name: string;
  source: BibleProviderSource;
  language?: string;
  languageName?: string;
  textDirection?: "ltr" | "rtl";
  licenseLabel?: string;
  licenseUrl?: string;
  licenseNotice?: string;
  numberOfBooks?: number;
  totalNumberOfChapters?: number;
  providerId?: string;
};

export type BibleBook = {
  id: string;
  name: string;
  testament: Testament;
  order: number;
  chapters: number;
  isApocryphal?: boolean;
};

export type BibleVerse = {
  number: number;
  text: string;
};

export type ChapterPointer = {
  bookId: string;
  chapter: number;
};

export type BibleChapter = {
  versionId: string;
  bookId: string;
  chapter: number;
  reference: string;
  verses: BibleVerse[];
  contentHtml?: string;
  contentBlocks?: unknown[];
  previous?: ChapterPointer;
  next?: ChapterPointer;
  copyright?: string;
  fums?: {
    fumsId?: string;
    fumsJsInclude?: string;
    fumsJs?: string;
  };
  source: BibleProviderSource;
};

export type BibleSearchResult = {
  versionId: string;
  bookId: string;
  bookName: string;
  chapter: number;
  verse: number;
  reference: string;
  text: string;
};

export type BibleSearchResponse = {
  query: string;
  versionId: string;
  resultCount: number;
  results: BibleSearchResult[];
  searchedScope: "complete-translation" | "provider-search";
};

export type BibleProvider = {
  listVersions(): Promise<BibleVersion[]>;
  listBooks(versionId: string): Promise<BibleBook[]>;
  getChapter(
    versionId: string,
    bookId: string,
    chapter: number,
  ): Promise<BibleChapter>;
  search?(
    versionId: string,
    query: string,
    options?: {
      limit?: number;
      offset?: number;
    },
  ): Promise<BibleSearchResponse>;
};

export class BibleProviderError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "BibleProviderError";
    this.status = status;
  }
}
