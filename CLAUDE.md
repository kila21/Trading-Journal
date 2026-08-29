@AGENTS.md

# Trading Journal

A personal trading journal — **built and deployed**, not a work-in-progress
skeleton. The authenticated dashboard *is* the app: month overview/calendar,
full trade log (CRUD + filters + CSV), a strategy playbook, and an analytics
page. The landing page (`/`) is just the marketing front. Live at
https://trading-journal-free.netlify.app.

## Stack

- Next.js `16.2.10` (App Router, Turbopack, TypeScript, `src/` dir)
- Tailwind CSS `4` (CSS-first config, no `tailwind.config.js`)
- `next-intl` `4` for i18n (English `en` + Georgian `ka`)
- Prisma `7.8` + **Neon Postgres**, via the `@prisma/adapter-neon` driver adapter
  (`PrismaNeon` + `@neondatabase/serverless` + `ws`) — see `src/lib/prisma.ts`
- [Better Auth](https://better-auth.com) `1` for email/password auth
- `@tanstack/react-virtual` (trades table), `@netlify/blobs` (chart images in prod)
- Deployed on Netlify; `npm run build:netlify` = `prisma migrate deploy && next build`

Versions matter here — this stack has moved fast and training data is likely stale.
`AGENTS.md` (imported above) points at `node_modules/next/dist/docs/` for the
ground-truth Next.js docs for this exact installed version. Check bundled/official
docs before assuming an API from memory, especially for Next.js, Tailwind, next-intl,
Prisma, and Better Auth.

## Design system — modeled on wealthyeye.ge

The visual identity is deliberately modeled on https://wealthyeye.ge/ (pulled from
its actual compiled `createTheme()` call, not guessed):

- Dark mode only, no light/dark toggle. `color-scheme: dark`.
- Tokens live in `src/app/globals.css`: raw CSS vars on `:root`
  (`--background #111012`, `--foreground #f5f5f5`, `--surface #1a191c`,
  `--primary #5c3aa0`, `--primary-foreground`, `--muted`, `--border`,
  `--success #0fae5b`, `--danger #ef4444`, `--warning #f59e0b`), each re-exported
  under `@theme inline` as `--color-*` — which auto-generates matching Tailwind
  utilities (`bg-primary`, `text-muted`, `text-success`, …). Fonts:
  `--font-sans` / `--font-georgian` (from `Space Grotesk` + `Noto Sans Georgian`
  in `src/lib/fonts.ts`).
- Need a new color? Extend `@theme` in `globals.css` — do **not** add a
  `tailwind.config.ts`.

## Folder structure

```
src/
├── proxy.ts             # next-intl locale middleware + optimistic /dashboard cookie gate
│                          (Next 16 renamed middleware.ts -> proxy.ts; MUST live in src/)
├── i18n/                # routing.ts (locales), request.ts (per-request messages), navigation.ts
├── messages/            # en.json / ka.json — identical key shape, 375 leaf keys each
├── types/              # trade.ts, setup.ts, trading-session.ts, trading-settings.ts, calendar.ts
├── generated/prisma/     # generated Prisma client (gitignored; `npm run db:generate`)
├── config/              # vocab lists + nav, all `as const` string unions, rendered verbatim (no i18n):
│                          trade-symbols, trade-timeframes, trade-sessions (NY kill zones),
│                          trade-mistake-tags, trade-emotions, trade-instruments, instrument-specs
│                          (contract-type -> $/point), site.ts, dashboard-nav.ts
├── lib/
│   ├── prisma.ts         # PrismaClient singleton on globalThis (Neon adapter)
│   ├── auth.ts / auth-client.ts   # Better Auth server instance / React client
│   ├── require-guest.ts  # redirectIfAuthenticated() — bounce logged-in users off /login etc
│   ├── metadata.ts       # createMetadata() per-locale <head> builder
│   ├── validate-trade.ts / validate-setup.ts / validate-trading-settings.ts  # hand-rolled, no zod
│   ├── trade-image-storage.ts (+ -local / -blobs)   # disk in dev, Netlify Blobs when IMAGE_STORAGE_DRIVER=blobs
│   ├── image-file.ts, use-media-query.ts, fonts.ts, utils.ts (cn)
├── app/
│   ├── layout.tsx        # bare root layout (children only)
│   ├── globals.css
│   ├── api/              # route handlers, all check auth.api.getSession + scope to session.user.id:
│   │                        auth/[...all], trades (GET year+month|range, POST), trades/[id] (PATCH/DELETE),
│   │                        trades/[id]/images, trade-images/[imageId], setups, setups/[id], trading-settings
│   └── [locale]/
│       ├── layout.tsx    # <html lang>, fonts, NextIntlClientProvider
│       ├── page.tsx      # landing (redirectIfAuthenticated -> /dashboard)
│       ├── login/ register/ about/ privacy/ terms/ risk-disclaimer/   # login+register use Better Auth
│       └── dashboard/
│           ├── layout.tsx   # AUTHORITATIVE auth gate: auth.api.getSession() + redirect; renders <Sidebar>
│           ├── page.tsx     # overview: calendar/agenda/equity toggle, net-P&L, stats, inline day panel
│           ├── analytics/   # analytics page (~13 per-dimension breakdown cards)
│           ├── trades/      # page.tsx (log+filters); new/, [id]/ (detail), [id]/edit/
│           └── playbook/    # page.tsx (setups list); [id]/ (setup detail + per-condition stats)
├── components/
│   ├── ui/              # generic copy-free primitives (Button, Card, Dialog, ToggleChipGroup,
│   │                       SearchableMultiSelectPopover, BarTrack, EquityCurveChart, …)
│   ├── landing/          # landing-only sections (navbar, hero, footer + resources/ faq/ about/ subfolders)
│   ├── auth/             # login-form, register-form, password-recovery-modal, user-menu (logout lives here)
│   └── dashboard/
│       ├── overview/ calendar/ analytics/ playbook/ settings/ (modal only, no route)
│       └── trades/       # trade-form.tsx (form body + live R:R/P&L/risk panel),
│                            trade-form-page.tsx (wraps it for /new and /[id]/edit),
│                            trade-detail-view.tsx, calendar-day-panel.tsx, trade-stats.ts,
│                            trade-breakdown-stats.ts, trade-filters.ts, trade-csv.ts,
│                            normalize-trade.ts, image managers, use-* hooks
└── prisma/
    ├── schema.prisma      # provider = "postgresql", url lives in prisma.config.ts (not inline)
    └── migrations/        # 7 migrations, all Postgres from 20260706161550_init
```

`ui/` primitives stay **copy-free and business-logic-free** so any page can reuse
them. Anything page-specific (copy, links, layout, section-specific icons) lives in
`landing/` or `dashboard/`. Within a `dashboard/` subfolder, a section gets its own
file once it has real content; don't create a folder to hold one file.

## i18n

- Locales: `en` (default), `ka`. Route segment `app/[locale]/...`.
- Add new UI copy to **both** `src/messages/en.json` and `ka.json` with identical
  key structure — never hardcode user-facing strings. Keep the leaf-key counts
  equal (a mismatch is the usual next-intl runtime failure).
- Use `Link` / `redirect` / `usePathname` / `useRouter` from `@/i18n/navigation`
  (not raw `next/link` / `next/navigation`) so the locale prefix is preserved.
- Message arrays (`about.paragraphs`, `terms.items`, `faq.items`, …) are read with
  `t.raw("items")`, not `t("items")`.
- The `authStub` message namespace name is **legacy** — it holds real login/register
  copy now, not stub text. Don't rename it without migrating both message files.
- Config vocab lists (mistake tags, emotions, setups, symbols) render **verbatim**
  — deliberately no i18n keys, same as the reference journals.

## Data layer

Prisma + **Neon Postgres** (`DATABASE_URL` is a `postgresql://…neon.tech/…` URL —
see `.env.example`). Local dev and production both use Neon (separate branches).
There is **no SQLite and no `dev.db`** — any reference to either is stale.

Models (`prisma/schema.prisma`):
- Better Auth's `User` / `Session` / `Account` / `Verification`
- `Trade` — a logged trade. `direction` / `setup` / `mistakeTags[]` / `emotions[]`
  are plain strings (validated in `src/lib/validate-trade.ts`, not Postgres enums).
  `exitDate` is nullable and can be a later day (swing holds). `contractSize` holds
  a contract-type key into `src/config/instrument-specs.ts`. `commission` and
  `pointValue` are **deprecated** columns — kept nullable, no longer written by the app.
- `Setup` — playbook strategy (name unique per user, `conditions[]`, `minR`, …).
  `Trade.setup` soft-references it by name (no FK) so history survives renames.
- `TradingSettings` — per-user singleton, just `accountBalance` so far. Named to
  avoid colliding with Better Auth's `Account`.
- `TradeImage` — chart screenshot, tagged by timeframe.

**Naming heads-up:** a real brokerage/portfolio `Account` model still doesn't exist.
When it's added it must be named `TradingAccount` (Better Auth already owns `Account`).

Image storage: `src/lib/trade-image-storage.ts` picks local disk
(`uploads/trade-images/`) or Netlify Blobs based on `IMAGE_STORAGE_DRIVER` — dev is
always disk; Netlify sets the env var to `blobs`. Routes never touch a concrete impl.

## Auth

Real email/password auth via Better Auth (see `NOTES.md` for why not Auth.js). No
OAuth, no email verification (the `Verification` table is unused), 1-day
non-rolling session. Key files: `src/lib/auth.ts` (server instance, Prisma adapter
with `provider: "postgresql"`), `src/lib/auth-client.ts` (`signIn` / `signUp` /
`signOut` / `useSession` / `changePassword`), `src/app/api/auth/[...all]/route.ts`,
`src/components/auth/` (forms + `user-menu.tsx`, which also holds logout and the
change-password / trading-settings modals).

**Route protection is two layers:**
1. `src/proxy.ts` — optimistic `getSessionCookie` check on `^/(en|ka)/dashboard`,
   redirects obviously-logged-out visitors to `/login`.
2. `src/app/[locale]/dashboard/layout.tsx` — **the authoritative** DB-backed
   `auth.api.getSession()` check.

Add new protected routes **under `dashboard/`** so they inherit the layout gate;
don't rely on the proxy check alone.

## Known gotchas (hit repeatedly in this exact stack)

- **Restart `npm run dev` after every `db:migrate`.** `src/lib/prisma.ts` caches
  the `PrismaClient` on `globalThis` to survive Turbopack HMR. A dev server started
  before a schema change keeps the old client shape in memory — new columns/models
  are silently invisible (reads return rows without the field → `undefined`; writes
  throw "Unknown argument"). This bites every single time.
- **`proxy.ts` location:** Next 16 renamed `middleware.ts` → `proxy.ts` (and the
  exported fn `middleware` → `proxy`). With a `src/` dir it must live **inside
  `src/`**, next to `app/` — at the repo root it silently breaks locale routing.
- **`"type": "module"`** is required in the root `package.json` for Prisma 7's ESM
  client — without it, model delegates (`prisma.trade`, …) come back `undefined`
  with no error. It's set; don't remove it.
- **Prisma config** lives in `prisma.config.ts` (not inline `url` in
  `schema.prisma`) and needs `import "dotenv/config"` to load `.env` outside Next.
- The Neon adapter needs `neonConfig.webSocketConstructor = ws` — already wired in
  `src/lib/prisma.ts`.
- Generated client (`src/generated/prisma`) is gitignored; `postinstall` runs
  `db:generate`, but run it manually after pulling schema changes.

## Not built yet — don't add unprompted

Brokerage/`TradingAccount` model, email verification, password reset via email,
account deletion, OAuth providers, automated tests.

## Scripts

- `npm run dev` / `build` / `start` — standard Next.js
- `npm run lint` / `lint:fix` — ESLint
- `npm run typecheck` — `tsc --noEmit`
- `npm run db:generate` / `db:migrate` (`prisma migrate dev`) / `db:studio`
- `npm run build:netlify` — `prisma migrate deploy && next build` (Netlify only)
- `postinstall` — runs `prisma generate`
