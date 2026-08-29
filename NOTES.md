# Project Notes (personal reference)

This file is for **you** — a tour of the repo written for someone who knows React
but is new to Next.js and Prisma. (`README.md` is the public-facing project doc,
`CLAUDE.md` is instructions for the AI agent — this one is just for learning the
codebase.)

## Next.js in one minute (for a React dev)

- **Folders are URLs.** `src/app/[locale]/login/page.tsx` becomes the route
  `/en/login`. You don't write a router — the file system *is* the router.
- **Special file names mean something.** `page.tsx` renders the route,
  `layout.tsx` wraps it and persists across navigation (nav bars, providers,
  auth gates).
- **`[locale]` is a dynamic segment** — matches anything and passes it as a
  `params` value, which is how one set of files serves both `/en/...` and
  `/ka/...`.
- **Components are Server Components by default.** Most render on the server
  and ship no JS. Add `"use client"` only when a file needs browser
  interactivity (`useState`, `onClick`, etc.). Almost every dashboard component
  is a client component — they fetch and chart live data.
- **`src/`** is just an organizational choice — keeps app code visually
  separate from root config files (`package.json`, `next.config.ts`, etc.).

## Folder-by-folder tour

| Folder | What's in it |
|---|---|
| `src/app/[locale]/` | Every real page/route. `dashboard/` is the authenticated app; `login/`, `register/` are Better Auth forms; `about`/`privacy`/`terms`/`risk-disclaimer` are static; the rest is the landing page. |
| `src/app/api/` | Route handlers (`route.ts`) — Better Auth catch-all, trades CRUD, trade-image upload/serve/edit/delete, playbook setups CRUD, trading-settings. Every one checks the session and scopes queries to the current user. |
| `src/components/ui/` | Generic, copy-free primitives (Button, Card, Dialog, ToggleChipGroup, SearchableMultiSelectPopover, BarTrack, EquityCurveChart…) shared everywhere. |
| `src/components/landing/` | Landing-page-only sections (Navbar, Hero, FAQ…), pull copy from `src/messages/`. |
| `src/components/auth/` | Login/register forms, `user-menu.tsx` (avatar dropdown — logout, change password, trading settings), `auth-error-message.ts`. Client components calling `authClient` directly. |
| `src/components/dashboard/` | The real app: `overview/` (net P&L, stat tiles, page composition), `calendar/` (+ `calendar-agenda`), `analytics/` (~13 breakdown cards), `playbook/`, `trades/` (form + detail views, stats, filters, CSV, image managers, hooks), `settings/` (a modal, not a route), plus shared `icons.tsx` / `format-pnl.ts` at the root. Trade create/edit/detail are dedicated routes under `dashboard/trades/`, not modals. |
| `src/config/` | Static `as const` vocab lists (symbols, timeframes, sessions, mistake tags, emotions, instruments, contract point values) + nav links — kept out of components so they're easy to find/change. Values render verbatim in the UI (no i18n). |
| `src/i18n/` | next-intl setup: `routing.ts` (locales), `navigation.ts` (locale-aware Link/router), `request.ts` (per-request message loading). |
| `src/lib/` | Cross-cutting singletons/helpers: `prisma.ts`, `auth.ts` / `auth-client.ts`, `require-guest.ts`, `metadata.ts`, `trade-image-storage*.ts`, `image-file.ts`, `use-media-query.ts`, `validate-*.ts` (hand-rolled, no zod), `utils.ts`, `fonts.ts`. |
| `src/types/` | Shared TypeScript types: `trade.ts` (the big one — `TradeDTO`, all the breakdown-row shapes), `setup.ts`, `trading-session.ts`, `trading-settings.ts`, `calendar.ts`. |
| `src/messages/` | `en.json` / `ka.json` — all UI copy, identical key shape in both (375 leaf keys each). |
| `src/proxy.ts` | Locale routing + optimistic logged-out redirect for `/dashboard`. |
| `src/generated/prisma/` | Auto-generated Prisma client (gitignored) — `npm run db:generate`, never hand-edited. |
| `prisma/` | `schema.prisma` (models) + `migrations/` (7, all Postgres). |
| `public/` | Static files served as-is (landing page illustrations). |
| `uploads/` | Local chart-image storage in dev (gitignored). Production uses Netlify Blobs instead. |

`.next/` is Next's build/cache output — auto-generated, gitignored, safe to
delete any time (`rm -rf .next` is a normal "something looks stale" fix).

## Where things stand

**What exists and ships:**

- **Landing page, i18n, design system** — dark-only, modeled on wealthyeye.ge,
  English + Georgian.
- **Auth** — real email/password via Better Auth. Two-layer route protection:
  `proxy.ts` optimistic cookie check + `dashboard/layout.tsx` authoritative
  `getSession`. Change-password from the account menu. No OAuth, no email
  verification, 1-day sessions.
- **Dashboard overview** — month calendar (color-coded by P&L) with an agenda
  list and equity-curve toggle, net-P&L card, best/worst day + streak stats.
- **Trades** — full log with client-side filtering (setup, session, symbol,
  direction, mistake tags, emotions, plan adherence, outcome, text search),
  sortable virtualized table / mobile card list, CSV export, dedicated
  new/detail/edit pages with a live R:R / P&L / risk panel.
- **Playbook** — define setups (entry conditions, min R, sessions, instruments),
  per-setup performance + per-condition compliance stats.
- **Analytics** — win rate / P&L by setup, session, symbol, direction, weekday,
  hour; R-multiple distribution; hold-time buckets; planned-vs-achieved R;
  discipline (plan adherence + cost by mistake); performance by emotion;
  consecutive-trade streaks. Range tabs (month / 90d / YTD / all).
- **Chart images** — per-trade screenshots tagged by timeframe, paste / drag-drop
  / file picker, lightbox with prev-next.
- **Per-instrument sizing** — contract-type selector (E-mini / Micro / …) drives
  a `$/point` value, so P&L and dollar risk are derived, not typed.
- **Deployed** — Netlify, Neon Postgres (separate `dev` / `production` branches),
  chart images on Netlify Blobs in production (`IMAGE_STORAGE_DRIVER=blobs`).

**Not built yet:** brokerage/`TradingAccount` model, deposit/withdrawal history,
email verification, password reset via email, account deletion, automated tests.

## If you only open 6 files, open these

1. `src/app/[locale]/layout.tsx` — fonts, translations, `<html lang>`
2. `src/app/[locale]/dashboard/layout.tsx` — the authoritative auth gate + sidebar
3. `src/components/dashboard/overview/dashboard-overview.tsx` — how the dashboard is composed
4. `src/proxy.ts` — how requests get routed and gated
5. `prisma/schema.prisma` — every model in the app
6. `src/lib/prisma.ts` — how the app talks to the database (Neon adapter)

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
| `src/i18n/navigation.ts` | Locale-aware `Link` / `redirect` / `usePathname` / `useRouter` — use these instead of raw `next/link` / `next/navigation` so the `/en` / `/ka` prefix is never dropped. |
| `src/messages/en.json`, `ka.json` | All copy, same key shape in both files. Arrays read with `t.raw(...)`. |
| `next.config.ts` | Wraps the config with `createNextIntlPlugin("./src/i18n/request.ts")`. |

### Auth

Better Auth owns sessions and its own `User` / `Session` / `Account` / `Verification`
Prisma models. `proxy.ts`'s check is a fast/optimistic gate; the real check happens
server-side in `dashboard/layout.tsx`.

| File | Role |
|---|---|
| `src/lib/auth.ts` | Server-side Better Auth instance (`betterAuth(...)`), Prisma adapter with `provider: "postgresql"`, email/password, 1-day non-rolling session. |
| `src/lib/auth-client.ts` | Browser client — exports `signIn`, `signUp`, `signOut`, `useSession`, `changePassword`. |
| `src/app/api/auth/[...all]/route.ts` | Catch-all route handler; delegates everything to Better Auth. |
| `src/components/auth/login-form.tsx`, `register-form.tsx`, `user-menu.tsx`, `password-recovery-modal.tsx` | Client components calling `authClient` directly (no Server Actions). `user-menu.tsx` holds logout. |
| `src/app/[locale]/dashboard/layout.tsx` | **The authoritative check** — calls `auth.api.getSession()` server-side before rendering any dashboard page. |
| `src/lib/require-guest.ts` | `redirectIfAuthenticated(locale)` — the inverse: bounces logged-in users off `/login` etc. |

### Data layer (Prisma)

One schema file, one generated client, one shared connection — to **Neon Postgres**.

| File | Role |
|---|---|
| `prisma/schema.prisma` | Every model: Better Auth's `User` / `Session` / `Account` / `Verification`, plus `Trade`, `Setup`, `TradingSettings`, `TradeImage`. `provider = "postgresql"`, no inline `url`. |
| `prisma.config.ts` | Holds the datasource `url` (from `process.env.DATABASE_URL`) and migrations path. Needs `import "dotenv/config"` at the top. |
| `prisma/migrations/` | One migration per schema change, applied in order — 7 so far, all Postgres from the initial one. |
| `src/lib/prisma.ts` | The one hand-written Prisma file: builds the `PrismaClient` with the **Neon serverless adapter** (`PrismaNeon` + `neonConfig.webSocketConstructor = ws`), caches it on `globalThis` so dev-mode HMR doesn't open a new connection per save. **Restart `npm run dev` after any migration** — the cached client won't see new columns otherwise. |
| `src/generated/prisma/` | Auto-generated client code (gitignored) — regenerated by `npm run db:generate` (and `postinstall`), never hand-edited. Imported as `@/generated/prisma/client`. |

### API routes & trade data flow

Every route below checks `auth.api.getSession()` first and scopes all queries
to `session.user.id` — nothing is fetched or written across users.

| File | Role |
|---|---|
| `src/app/api/trades/route.ts` | `GET` (list trades by `year`+`month`, or by `range=month\|90d\|ytd\|all`) / `POST` (create). |
| `src/app/api/trades/[id]/route.ts` | `PATCH` / `DELETE` a single owned trade. |
| `src/app/api/setups/route.ts`, `setups/[id]/route.ts` | Playbook setups CRUD (`P2002` → 409 on duplicate name). |
| `src/app/api/trading-settings/route.ts` | `GET` / `PATCH` (upsert `accountBalance`). |
| `src/lib/validate-trade.ts` / `validate-setup.ts` / `validate-trading-settings.ts` | Shared hand-rolled validation for the routes above (no `zod`). |
| `src/components/dashboard/trades/use-month-trades.ts` / `use-trades-range.ts` | Client hooks — fetch trades for a month / preset range, expose `refetch`. Both run responses through `normalize-trade.ts`. |
| `src/components/dashboard/trades/normalize-trade.ts` | Fills `[]` defaults for `emotions` / `mistakeTags` / `checkedConditions` on trades coming over the wire — guards against old rows and stale dev-server responses. |
| `src/components/dashboard/trades/trade-stats.ts` | Per-day P&L, month summary (best/worst day, streak), equity curve, drawdown, R-multiples, hold time, profit factor, expectancy, dollar risk. |
| `src/components/dashboard/trades/trade-breakdown-stats.ts` | Group-by breakdowns for Analytics (setup / session / symbol / direction / weekday / hour / mistake / emotion / plan). |
| `src/components/dashboard/overview/dashboard-overview.tsx` | Wires the hook + stats into the calendar/agenda; a day with trades opens an inline `CalendarDayPanel`, an empty day links to `/dashboard/trades/new`. |

### Trade chart images

Upload is trade-scoped; everything after that is addressed by the image's own
id (an image doesn't need its parent trade in the URL once it exists).

| File | Role |
|---|---|
| `src/app/api/trades/[id]/images/route.ts` | `GET` (list) / `POST` (upload — png/jpeg/webp, 5 MB max, timeframe validated). |
| `src/app/api/trade-images/[imageId]/route.ts` | `GET` (serve the file bytes) / `PATCH` (edit timeframe + caption) / `DELETE` — by image id alone. |
| `src/lib/trade-image-storage.ts` | Storage interface (`save` / `read` / `delete`) — picks `trade-image-storage-local.ts` (disk, `uploads/trade-images/`) or `trade-image-storage-blobs.ts` (Netlify Blobs) based on `IMAGE_STORAGE_DRIVER`. Routes/components never touch either implementation directly. |
| `src/components/dashboard/trades/use-trade-images.ts` | Client hook — fetches images for an existing trade. |
| `src/components/dashboard/trades/trade-image-manager.tsx` | Network-backed manager for a saved trade (edit form + detail view). |
| `src/components/dashboard/trades/pending-image-manager.tsx` | Local-only staging for the create form — a brand-new trade has no id to upload to yet, so files sit in memory (with a live preview) until the trade is saved. |
| `src/components/dashboard/trades/use-image-drop-zone.ts` | Shared paste / drag-drop wiring for the add-image forms. |
| `src/components/dashboard/trades/trade-image-gallery.tsx` | Read-only display with the lightbox (prev / next / counter). |

### Dashboard composition

| Folder | Contains |
|---|---|
| `src/components/dashboard/overview/` | `dashboard-overview.tsx` (page composition), `net-pnl-card.tsx`, `stats-grid.tsx`, `stat-tile.tsx`, `equity-curve-card.tsx`, `view-toggle.tsx`. |
| `src/components/dashboard/calendar/` | `calendar.tsx`, `calendar-agenda.tsx`, `calendar-header.tsx`, `day-cell.tsx`, `week-summary-bar.tsx`, `calendar-grid.ts` (week/grid math), `format-date.ts` (locale-safe date strings). |
| `src/components/dashboard/analytics/` | `analytics-overview.tsx` + `bar-list-card.tsx` + ~13 per-dimension cards (setup, session, symbol, direction, day-of-week, hour, R-distribution, hold-time, streaks, discipline, wins-vs-losses, planned-vs-achieved, emotion). |
| `src/components/dashboard/playbook/` | `playbook-overview.tsx`, `setup-card.tsx`, `setup-form.tsx` / `setup-form-modal.tsx`, `setup-detail-overview.tsx`, `setup-condition-stats.ts`, `use-setups.ts`. |
| `src/components/dashboard/trades/` | `trade-form.tsx` (form body + live R:R / P&L / risk panel), `trade-form-page.tsx` (wraps it for `/new` and `/[id]/edit`), `trade-detail-view.tsx` (`/[id]` read view + chart images), `calendar-day-panel.tsx` (inline day list), `trades-overview.tsx` / `trades-table.tsx` / `trades-card-list.tsx` / `trades-filter-bar.tsx`, `trading-session.ts` (DST-aware NY session lookup), `use-*` hooks. |
| `src/components/dashboard/icons.tsx`, `format-pnl.ts` | Shared across the folders above — stay at the `dashboard/` root. |
