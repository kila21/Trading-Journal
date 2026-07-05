# Project Notes (personal reference)

This file is for **you** — a tour of the repo written for someone who knows React
but is new to Next.js and Prisma. (`README.md` is the public-facing project doc,
`CLAUDE.md` is instructions for the AI agent — this one is just for learning the
codebase.)

## Next.js in one minute (for a React dev)

- **Folders are URLs.** `src/app/[locale]/login/page.tsx` becomes the route
  `/en/login`. You don't write a router — the file system *is* the router.
- **Special file names mean something.** `page.tsx` renders the route,
  `layout.tsx` wraps it and persists across navigation (nav bars, providers).
- **`[locale]` is a dynamic segment** — matches anything and passes it as a
  `params` value, which is how one set of files serves both `/en/...` and
  `/ka/...`.
- **Components are Server Components by default.** Most render on the server
  and ship no JS. Add `"use client"` only when a file needs browser
  interactivity (`useState`, `onClick`, etc.).
- **`src/`** is just an organizational choice — keeps app code visually
  separate from root config files (`package.json`, `next.config.ts`, etc.).

## Folder-by-folder tour

| Folder | What's in it |
|---|---|
| `src/app/[locale]/` | Every real page/route. `dashboard/` is the authenticated app; `login/`, `register/` are Better Auth forms; the rest is the landing page. |
| `src/app/api/` | Route handlers (`route.ts`) — auth catch-all, trades CRUD, trade image upload/read/update/delete. |
| `src/components/ui/` | Generic, copy-free primitives (Button, Card, Dialog, Accordion...) shared by landing and dashboard. |
| `src/components/landing/` | Landing-page-only sections (Navbar, Hero, FAQ...), pull copy from `src/messages/`. |
| `src/components/auth/` | Login/register forms, logout button — client components calling `authClient` directly. |
| `src/components/dashboard/` | The real app: `overview/` (net P&L, stat tiles, page composition), `calendar/`, `trades/` (modals, forms, hooks), plus shared `icons.tsx`/`format-pnl.ts` at the root. |
| `src/config/` | Static option lists (symbols, timeframes, sessions) and nav links — kept separate from components so they're easy to find/change. |
| `src/i18n/` | next-intl setup: `routing.ts` (locales), `navigation.ts` (locale-aware Link/router), `request.ts` (per-request message loading). |
| `src/lib/` | Cross-cutting singletons/helpers: `prisma.ts`, `auth.ts`/`auth-client.ts`, `trade-image-storage.ts`, `validate-trade.ts`, `utils.ts`, `fonts.ts`, `metadata.ts`. |
| `src/messages/` | `en.json`/`ka.json` — all UI copy, identical key shape in both. |
| `src/proxy.ts` | Locale routing + optimistic logged-out redirect for `/dashboard`. |
| `prisma/` | `schema.prisma` (models) + `migrations/` (history). |
| `public/` | Static files served as-is (e.g. landing page illustrations). |

`.next/` is Next's build/cache output — auto-generated, gitignored, safe to
delete any time (`rm -rf .next` is a normal "something looks stale" fix).

## Where things stand (as of 2026-07-06)

- **Phase 1 — landing page, i18n, design system:** done.
- **Phase 2 — auth:** done. Real email/password via Better Auth, two-layer
  route protection (`proxy.ts` optimistic + `dashboard/page.tsx` authoritative).
- **Phase 3 — dashboard:** in progress. Sidebar, month calendar (color-coded by
  P&L), trade create/edit/review/detail modals, and chart-image uploads all
  work against real `Trade`/`TradeImage` models (SQLite via `dev.db`).
- **Not done yet:** brokerage `Account` model, analytics page, password
  reset/email verification, automated tests, hosted Postgres swap for deploy.

## If you only open 6 files, open these

1. `src/app/[locale]/layout.tsx` — fonts, translations, `<html lang>`
2. `src/components/dashboard/overview/dashboard-overview.tsx` — how the dashboard is composed
3. `src/i18n/routing.ts` — the two supported locales
4. `src/proxy.ts` — how requests get routed and gated
5. `prisma/schema.prisma` — every model in the app
6. `src/lib/prisma.ts` — how the app talks to the database

---

## How the pieces connect

A map of each subsystem: what it does and which files make it up.

### Routing & i18n

Folders under `src/app/[locale]/` are the routes; `proxy.ts` decides which
locale to serve and bounces logged-out visitors away from `/dashboard`.

| File | Role |
|---|---|
| `src/proxy.ts` | Runs on every request. Locale detection/redirect (via `createMiddleware`), plus an optimistic `getSessionCookie` check that redirects `/dashboard` to `/login` if there's no session cookie. |
| `src/i18n/routing.ts` | Declares locales (`en`, `ka`) and the default. |
| `src/i18n/request.ts` | Tells next-intl which `src/messages/*.json` file to load per request. |
| `src/i18n/navigation.ts` | Locale-aware `Link`/`redirect`/`useRouter` — use these instead of raw `next/link`/`next/navigation` so the `/en`/`/ka` prefix is never dropped. |
| `src/messages/en.json`, `ka.json` | All copy, same key shape in both files. |

### Auth

Better Auth owns sessions and its own `User`/`Session`/`Account`/`Verification`
Prisma models (see schema below). `proxy.ts`'s check is a fast/optimistic
gate; the real check happens server-side in the protected page itself.

| File | Role |
|---|---|
| `src/lib/auth.ts` | Server-side Better Auth instance (`betterAuth(...)`), wired to Prisma. |
| `src/lib/auth-client.ts` | Browser client — exports `signIn`, `signUp`, `signOut`, `useSession`. |
| `src/app/api/auth/[...all]/route.ts` | Catch-all route handler; delegates everything to Better Auth. |
| `src/components/auth/login-form.tsx`, `register-form.tsx`, `logout-button.tsx` | Client components calling `authClient` directly (no Server Actions). |
| `src/app/[locale]/dashboard/page.tsx` | The authoritative check — calls `auth.api.getSession()` server-side before rendering. |

### Data layer (Prisma)

One schema file, one generated client, one shared connection.

| File | Role |
|---|---|
| `prisma/schema.prisma` | Every model: Better Auth's `User`/`Session`/`Account`/`Verification`, plus `Trade` and `TradeImage`. |
| `prisma/migrations/` | One migration per schema change, applied in order — the schema's history. |
| `src/lib/prisma.ts` | The one hand-written Prisma file: builds the `PrismaClient` with the SQLite driver adapter, caches it on `globalThis` so dev-mode HMR doesn't open a new connection per save. |
| `src/generated/prisma/` | Auto-generated client code (gitignored) — regenerated by `npm run db:generate`, never hand-edited. |
| `dev.db` | The actual SQLite file, at repo root. |

### API routes & trade data flow

Every route below checks `auth.api.getSession()` first and scopes all queries
to `session.user.id` — nothing is fetched or written across users.

| File | Role |
|---|---|
| `src/app/api/trades/route.ts` | `GET` (list a month's trades) / `POST` (create). |
| `src/app/api/trades/[id]/route.ts` | `PATCH` / `DELETE` a single trade. |
| `src/lib/validate-trade.ts` | Shared hand-rolled validation for both routes above (no `zod` yet). |
| `src/components/dashboard/trades/use-month-trades.ts` | Client hook — fetches a month's trades, exposes `refetch`. |
| `src/components/dashboard/trades/trade-stats.ts` | Turns raw trades into per-day P&L and month summary (best/worst day, streak). |
| `src/components/dashboard/overview/dashboard-overview.tsx` | Wires the hook + stats into the calendar and the create/review/detail modals. |

### Trade chart images

Upload is trade-scoped; everything after that is addressed by the image's own
id (an image doesn't need its parent trade in the URL once it exists).

| File | Role |
|---|---|
| `src/app/api/trades/[id]/images/route.ts` | `GET` (list) / `POST` (upload) for one trade's images. |
| `src/app/api/trade-images/[imageId]/route.ts` | `GET` (serve the file) / `PATCH` (edit timeframe+caption) / `DELETE` — by image id alone. |
| `src/lib/trade-image-storage.ts` | Storage interface (`save`/`read`/`delete`) — local disk under `uploads/trade-images/` today, swappable for object storage later without touching routes or components. |
| `src/components/dashboard/trades/use-trade-images.ts` | Client hook — fetches images for an existing trade. |
| `src/components/dashboard/trades/trade-image-manager.tsx` | Network-backed manager for an existing trade (Review/Edit flows). |
| `src/components/dashboard/trades/pending-image-manager.tsx` | Local-only staging for the create form — a brand-new trade has no id to upload to yet, so files just sit in memory until the trade is saved. |

### Dashboard composition

| Folder | Contains |
|---|---|
| `src/components/dashboard/overview/` | `dashboard-overview.tsx` (page composition), `net-pnl-card.tsx`, `stats-grid.tsx`, `stat-tile.tsx`. |
| `src/components/dashboard/calendar/` | `calendar.tsx`, `calendar-header.tsx`, `day-cell.tsx`, `calendar-grid.ts` (week/grid math), `format-date.ts` (locale-safe date strings). |
| `src/components/dashboard/trades/` | `trade-form.tsx`/`trade-form-modal.tsx` (create/edit), `trade-review-modal.tsx` (day list), `trade-detail-modal.tsx` (single-trade view + chart images), `trading-session.ts` (Asian/London/NY lookup), `use-month-trades.ts`, `use-trade-images.ts`. |
| `src/components/dashboard/icons.tsx`, `format-pnl.ts` | Shared across all three folders above (icons, currency formatting) — stay at the `dashboard/` root rather than in any one subfolder. |
