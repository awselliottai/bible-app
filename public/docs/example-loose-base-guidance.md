Recommended Next.js architecture

Use a normalized provider interface:

```typescript
type Testament = "old" | "new";

type BibleVersion = {
  id: string;
  abbreviation: string;
  name: string;
  source: "local" | "helloao" | "api-bible" | "youversion" | "esv";
  licenseLabel?: string;
};

type BibleBook = {
  id: string;        // GEN, EXO, MAT, JHN, etc.
  name: string;
  testament: Testament;
  order: number;
  chapters: number;
};

type BibleChapter = {
  versionId: string;
  bookId: string;
  chapter: number;
  reference: string;
  verses: Array<{
    number: number;
    text: string;
  }>;
  previous?: {
    bookId: string;
    chapter: number;
  };
  next?: {
    bookId: string;
    chapter: number;
  };
  copyright?: string;
};
```
Then create a provider abstraction:

```typescript
interface BibleProvider {
  listVersions(): Promise<BibleVersion[]>;
  listBooks(versionId: string): Promise<BibleBook[]>;
  getChapter(versionId: string, bookId: string, chapter: number): Promise<BibleChapter>;
  search?(versionId: string, query: string): Promise<unknown>;
}
```
Your UI can remain provider-agnostic:

/read/[version]/[book]/[chapter]

Example:

`/read/ESV/GEN/1
/read/NIV/JHN/3
/read/KJV/ROM/8`

For a reader-centric interface, paginate by chapter, not by arbitrary pages. A chapter is the natural unit for navigation, caching, linking, and comparison. API.Bible’s chapter response even includes next and previous chapter metadata, which fits this pattern well.

What I’d build first

Start with Free Use Bible API or its downloadable data. It already has:

`GET /api/available_translations.json
GET /api/{translation}/books.json
GET /api/{translation}/{book}/{chapter}.json`

The same project also offers downloadable api.zip, bible.db, and English-only bible.eng.db, which is useful if you want to import once and serve locally from SQLite/Postgres/static JSON.

For a simple MVP:

`/data/bibles/ESV/GEN/1.json
/data/bibles/NIV/GEN/2.json
/data/bibles/KJV/JHN/3.json`

Then your app can load chapters locally with no API dependency. Later, add ApiBibleProvider, YouVersionProvider, and EsvProvider behind the same interface.

Suggested version set

For a free/open default set:

ESV  - English Standard Version
NIV  - New International Version
KJV  - King James Version, with jurisdiction caveat


For licensed/popular versions through APIs:

ESV  - via Crossway ESV API or API.Bible
NIV  - via API.Bible / YouVersion / Biblica licensing
NKJV - via API.Bible/licensing
