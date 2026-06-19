- `00:24` — **Bible backend framework**
  - **Summary:** Added a backend-first Bible reader data framework with normalized provider types, a Free Use Bible API adapter, API routes for versions/books/chapters/search, and a Vercel AI SDK streaming study route. Replaced the starter page with a compact backend index showing the current endpoint surface.
  - **Why:** Establish the books -> chapters -> verses -> pagination/search/version-switcher architecture from `public/docs/example-loose-base-guidance.md` while keeping the frontend provider-agnostic for future reader UI work.
  - **Files:** `app/lib/bible/types.ts`, `app/lib/bible/helloao-provider.ts`, `app/lib/bible/provider.ts`, `app/lib/bible/http.ts`, `app/api/bible/versions/route.ts`, `app/api/bible/[versionId]/books/route.ts`, `app/api/bible/[versionId]/[bookId]/[chapter]/route.ts`, `app/api/bible/search/route.ts`, `app/lib/ai/bible-study.ts`, `app/api/ai/study/route.ts`, `app/page.tsx`, `app/layout.tsx`, `app/globals.css`, `README.md`, `package.json`, `pnpm-lock.yaml`
  - **Verification:** `pnpm run lint` passed. Initial `pnpm run build` failed because `next/font` could not fetch Geist from Google Fonts in the restricted environment, so the app was moved to local system font tokens. `pnpm run build` then passed with elevated permissions for Turbopack's local worker port. Local smoke test of `/` passed, and `/api/bible/BSB/JHN/3` returned normalized chapter JSON; a footnote-spacing edge case found during smoke testing was corrected.
  - **Follow-ups:** Build `/read/[version]/[book]/[chapter]` UI, add a version switcher, and consider local downloaded Bible data for faster full-text search.

- `00:35` — **Verification and package manifest correction**
  - **Summary:** Restored user-owned Drizzle/Neon/dotenv/tsx package entries and database/typecheck scripts after an over-narrow package cleanup, then refreshed `pnpm-lock.yaml`.
  - **Why:** The database tooling and `typecheck` script were intentionally added outside this Bible framework task and should remain part of the app baseline.
  - **Files:** `package.json`, `pnpm-lock.yaml`, `public/updates/06-19-26/rolling-log.md`
  - **Verification:** `pnpm run lint`, `pnpm run typecheck`, and `pnpm run build` passed. Build required elevated permissions because Turbopack binds a local worker port in this environment. Local smoke checks against `http://localhost:3001/`, `/read/BSB/JHN/3`, and `/search?version=BSB&q=love&limit=3` confirmed rendered HTML pages and `/read`/`/search` links instead of raw API navigation.
  - **Follow-ups:** None for this correction.

- `00:42` — **General Bible access homepage**
  - **Summary:** Replaced the implementation-facing backend framework index with a general Bible access view containing translation choices, search, Old/New Testament book browsing, a chapter picker, and a reader preview.
  - **Why:** The previous homepage was over-fitted to the initial backend prompt and exposed implementation capabilities rather than presenting a normal Bible reader entry point.
  - **Files:** `app/page.tsx`, `app/layout.tsx`, `public/updates/06-19-26/rolling-log.md`
  - **Verification:** `pnpm run lint`, `pnpm run typecheck`, and `pnpm run build` passed. Build required elevated permissions because Turbopack binds a local worker port in this environment.
  - **Follow-ups:** Wire the static browsing controls to real `/read/[version]/[book]/[chapter]` routes when the frontend reader is implemented.

- `00:58` — **API.Bible provider integration**
  - **Summary:** Added API.Bible as a second server-only Bible provider alongside HelloAO, including endpoint normalization, API-key fetch helper, version/book/chapter/search normalization, provider resolution, API.Bible FUMS metadata preservation, and dynamic homepage version listing from available providers.
  - **Why:** Licensed translations such as ESV and NIV should be available through API.Bible when the configured account plan returns them, without exposing the API key to browser code or hard-coding unavailable versions.
  - **Files:** `app/lib/bible/types.ts`, `app/lib/bible/provider.ts`, `app/lib/bible/helloao-provider.ts`, `app/lib/bible/providers/apiBibleFetch.ts`, `app/lib/bible/providers/apiBibleProvider.ts`, `app/components/ApiBibleFums.tsx`, `app/api/bible/versions/route.ts`, `app/api/bible/[versionId]/books/route.ts`, `app/api/bible/[versionId]/[bookId]/[chapter]/route.ts`, `app/api/bible/search/route.ts`, `app/lib/ai/bible-study.ts`, `app/page.tsx`, `README.md`, `public/updates/06-19-26/rolling-log.md`
  - **Verification:** `pnpm run lint`, `pnpm run typecheck`, and `pnpm run build` passed. Local smoke checks passed for `/api/bible/versions` with 221 API.Bible versions returned by the configured key, `/api/bible/ODLNT/books`, `/api/bible/ODLNT/JHN/3`, `/api/bible/search?version=ODLNT&q=Yesu&limit=3`, and the existing HelloAO route `/api/bible/BSB/JHN/3`. The configured API.Bible key did not return ESV/NIV/NLT/NKJV/NASB/CSB in `/v1/bibles`, so those aliases correctly remain unavailable until the API.Bible account plan exposes them.
  - **Follow-ups:** Render FUMS on real reader pages that display API.Bible Scripture content; move alias/provider mappings into the database when persistence for Bible metadata is implemented.

- `01:05` — **Drizzle Kit + Neon setup fix**
  - **Summary:** Fixed broken Drizzle database scripts and configuration. Updated `package.json` commands from deprecated `db:*` prefixes to current Drizzle Kit CLI (`push`, `introspect`, `migrate`). Pointed `drizzle.config.ts` at `lib/db/schema.ts` and `lib/db/relations.ts` instead of missing `./src/db/schema.ts`. Added starter schema/relations files, wired the Neon HTTP client in `lib/db/drizzle.ts`, seeded `drizzle/meta/_journal.json`, and documented the database workflow in `README.md`.
  - **Why:** `pnpm run pull` and `pnpm run generate` were failing due to outdated CLI command names and a missing schema path; Neon connectivity was already valid but tooling could not run.
  - **Files:** `package.json`, `drizzle.config.ts`, `lib/db/drizzle.ts`, `lib/db/schema.ts`, `lib/db/relations.ts`, `drizzle/meta/_journal.json`, `eslint.config.mjs`, `README.md`, `public/updates/06-19-26/rolling-log.md`
  - **Verification:** `pnpm run generate`, `pnpm run pull`, `pnpm run push`, `pnpm run migrate`, `pnpm run typecheck`, and `pnpm run lint` all passed against the connected Neon database (currently empty schema).
  - **Follow-ups:** Add real tables to `lib/db/schema.ts` when persistence features land; after `pull`, merge `drizzle/schema.ts` into `lib/db/schema.ts`.

- `01:07` — **Rendered Bible reader routes**
  - **Summary:** Replaced the homepage's static/API-link reader shell with a live server-rendered Bible reader, added reusable reader UI, introduced `/read/[version]`, `/read/[version]/[book]/[chapter]`, and `/search` pages, wired version/book/chapter/search controls to rendered pages instead of raw API JSON, and disabled Next data-cache writes for large HelloAO full-translation search payloads.
  - **Why:** Front-page Bible access controls were opening pure API responses, which broke the intended reader experience. The normalized provider responses now render directly into the page while API routes remain available as backend endpoints.
  - **Files:** `app/page.tsx`, `app/components/BibleReaderView.tsx`, `app/lib/bible/reader.ts`, `app/lib/bible/helloao-provider.ts`, `app/read/[versionId]/page.tsx`, `app/read/[versionId]/[bookId]/[chapter]/page.tsx`, `app/search/page.tsx`, `app/globals.css`, `README.md`
  - **Verification:** `pnpm run lint`, `pnpm run typecheck`, and `pnpm run build` passed. Build required elevated permissions because Turbopack binds a local worker port in this environment.
  - **Follow-ups:** Consider adding a client-side version switcher that preserves the current book/chapter when the target translation includes that book.
