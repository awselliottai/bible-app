# Bible App

Next.js 16 / React 19 application for a reader-centric Bible experience. The
current implementation focuses on backend data architecture: normalized Bible
versions, books, chapters, chapter pagination, search, and a Vercel AI SDK route
prepared for future LLM-assisted study features.

## Data Architecture

The Bible provider contract lives in `app/lib/bible/types.ts`:

- `listVersions()` returns normalized translation metadata.
- `listBooks(versionId)` returns book listings with testament and chapter counts.
- `getChapter(versionId, bookId, chapter)` returns chapter text as verses plus
  previous/next chapter pointers.
- `search(versionId, query)` returns verse-level search results.

The active provider is `helloAoBibleProvider`, backed by the Free Use Bible API
documented in `public/docs/bible-api-quick-reference.md`.

## API Routes

- `GET /api/bible/versions`
- `GET /api/bible/[versionId]/books`
- `GET /api/bible/[versionId]/[bookId]/[chapter]`
- `GET /api/bible/search?version=BSB&q=love&limit=10`
- `POST /api/ai/study`

The intended reader route shape is:

```txt
/read/[version]/[book]/[chapter]
```

Chapters are treated as the natural pagination unit for caching, stable links,
and comparison/version switching.

## AI Readiness

The project includes `ai` and `@ai-sdk/openai`. `POST /api/ai/study` streams a
passage-grounded response using the selected Bible chapter as context.

Required environment:

```bash
OPENAI_API_KEY=...
# Optional
OPENAI_MODEL=gpt-4.1-mini
BIBLE_API_ENDPOINT=https://bible.helloao.org
```

## Database (Neon + Drizzle)

The app uses Neon Postgres with Drizzle ORM. Schema definitions live in
`lib/db/schema.ts`; the Drizzle client is in `lib/db/drizzle.ts`.

Required environment:

```bash
DATABASE_URL=postgresql://...
```

Scripts (Drizzle Kit 0.31+ CLI):

```bash
pnpm run generate   # create SQL migrations from lib/db/schema.ts
pnpm run push       # push schema changes directly to Neon (dev)
pnpm run pull       # introspect Neon and write drizzle/schema.ts
pnpm run migrate    # apply migrations in drizzle/
pnpm run studio     # open Drizzle Studio
```

After `pnpm run pull`, merge any generated table definitions from
`drizzle/schema.ts` into `lib/db/schema.ts` so `generate` and `push` stay in
sync with the database.

## Development

```bash
pnpm run dev
pnpm run build
pnpm run lint
pnpm run typecheck
```

Open `http://localhost:3000` for the backend framework index.
