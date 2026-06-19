<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Repository Guidelines

## Project Structure & Module Organization
The Next.js App Router lives under `app/`. Runtime entrypoints are `app/page.tsx` and `app/layout.tsx`. Shared UI components should live in `app/components/` or `app/ui/`, and global styles are in `app/globals.css`. Static assets live under `public/`. 

## Console Logs

Add simple but effective console.logs to any code you touch for ease of interpretability, debugging, and visibility.

### Update Logs (required for any meaningful change)
All meaningful changes must be logged as **rolling daily updates** under `public/updates/`.

**Directory convention**
- Daily folder: `public/updates/MM-DD-YY/` (example: `public/updates/12-30-25/`).
- If you make changes on a date where the folder does not exist, **create it**.

**Canonical log file**
- Append entries to: `public/updates/MM-DD-YY/rolling-log.md`
- If it does not exist yet for the day, create it.

**What counts as “meaningful change” (log it)**
- Any behavior change (UI, API, routing, feature semantics).
- Any storage/schema/migration change.
- Any fix to production-impacting bugs, performance, or security.
- Any change that alters or expands workflows or docs in a way that affects usage.

**Entry format (append; newest at bottom)**
Each entry should be comprehensive and scannable:

- Timestamp (local) + short title
- What changed (high-level)
- Why (intent/rationale)
- Key files touched (paths)
- Verification performed (manual checks; commands if relevant)
- Follow-ups / TODOs (if any)

Suggested template:

- `HH:MM` — **Title**
  - **Summary:** …
  - **Why:** …
  - **Files:** `…`, `…`, `…`
  - **Verification:** …
  - **Follow-ups:** …

**Using rolling logs as a required execution reference (read-before-change)**
Rolling logs are not only for recording history—they are a primary source of operational context for future work.

Before implementing any non-trivial change:
- **Read the most recent relevant logs** under `public/updates/` (minimum: today + the most recent prior day(s) that touched the same subsystem).
- Use those entries to pick up **prior decisions, constraints, tradeoffs, schema assumptions, known pitfalls, and open TODOs**.
- If you diverge from a logged decision, **explicitly note the divergence** in today’s `rolling-log.md` (what changed and why).
- When continuing or extending earlier work, **locate the original date folder(s)** and treat them as canonical context alongside the codebase and `README.md`.
- After major or pressing, pertinent updates, **read `README.md`** to confirm the change is already covered and accurately reflects the app; if it does not, **update `README.md`** with revised or additional descriptions/categories so it remains complete.

In effect, agents should operate using:
1) the connected codebase,
2) the user’s prompt,
3) baseline documentation (e.g. `README.md`, `public/docs/*`),
4) and these rolling logs,
so each new task starts with strong, project-specific, up-to-date context.

## Build, Test, and Development Commands
- `npm run dev`: start the Next dev server.
- `npm run build` / `npm run start`: build and serve the production bundle.
- `npm run lint`: run Next/ESLint rules.

## Coding Style & Naming Conventions
TypeScript with Next 15/React 19 is standard. Components/pages use `PascalCase` exports, hooks/utilities use `camelCase`/`use*` prefixes. Prefer alias imports (`@/*`) instead of relative paths when crossing feature boundaries.

Conventions to follow:
- Client components are marked with `'use client'` and live primarily in `app/components/` or `app/ui/`; keep them focused on presentation and local UI state.
- Server-only logic belongs in `app/api/*` route handlers or server actions (`"use server"`).

## Operational Reachability / Dead Code Guidance
Canonical runtime entrypoints are `app/page.tsx` and `app/layout.tsx`. As the app grows, keep track of reachable components and clean up unused code to maintain a baseline.

## Commit & Pull Request Guidelines
Use concise, imperative commit messages. PRs should summarize scope, risks, and manual verification steps.

## Security & Configuration Tips
Never commit secrets; place credentials in `.env.local` or deployment-level settings.
