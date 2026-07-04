@AGENTS.md

# Trading Journal

A trading journal web app. **Current state (Phase 1): a single-page marketing/landing
site only** — not the authenticated dashboard yet. Login/Register are static stub
routes with no real auth. Real trade-log/analytics/dashboard features, auth, and data
models are future phases — do not build them unless explicitly asked.

## Stack

- Next.js `16.2.10` (App Router, Turbopack, TypeScript, `src/` dir)
- Tailwind CSS `4.3.2` (CSS-first config, no `tailwind.config.js`)
- `next-intl` for i18n (English `en` + Georgian `ka`)
- Prisma `7.8.0` + SQLite (local dev), via the `@prisma/adapter-better-sqlite3` driver adapter

Versions matter here — this stack has moved fast and training data is likely stale.
`AGENTS.md` (imported above) points at `node_modules/next/dist/docs/` for the
ground-truth Next.js docs for this exact installed version. Check bundled/official
docs before assuming an API from memory, especially for Next.js, Tailwind, next-intl,
and Prisma.

## Design system — modeled on wealthyeye.ge

The visual identity is deliberately modeled on the reference site https://wealthyeye.ge/
(pulled from its actual compiled `createTheme()` call, not guessed):

- Background `#111012`, primary accent `#5c3aa0` — dark mode only, no light/dark toggle
- Fonts: `Space Grotesk` (Latin) substituting for the reference site's paid/licensed
  "Stölzl", + `Noto Sans Georgian` (Georgian script) — both via `next/font/google`,
  wired in `src/lib/fonts.ts`
- Design tokens live in `src/app/globals.css` under `@theme inline` (`--color-background`,
  `--color-primary`, `--color-surface`, `--color-muted`, `--color-border`, `--font-sans`,
  `--font-georgian`). Any `--color-*` token there auto-generates matching Tailwind
  utilities (`bg-primary`, `text-muted`, etc.) — don't add a `tailwind.config.ts` for
  colors, extend `@theme` instead.

## Folder structure

```
src/
├── i18n/            # next-intl: routing.ts, request.ts, navigation.ts
├── messages/         # en.json / ka.json — keep key shape identical across locales
├── proxy.ts           # next-intl locale middleware (Next 16 renamed middleware.ts -> proxy.ts)
├── app/
│   ├── globals.css
│   ├── layout.tsx      # bare root layout (just children)
│   └── [locale]/       # all real routes live under here
│       ├── layout.tsx  # <html lang>, fonts, NextIntlClientProvider
│       ├── page.tsx    # landing page composition
│       ├── login/       # stub route, no real auth
│       └── register/    # stub route, no real auth
├── components/
│   ├── ui/            # generic, reusable primitives (Button, Card, Accordion) —
│   │                    no copy, no business logic. Reused by future dashboard.
│   └── landing/         # this-phase page composition, copy via useTranslations
│       ├── navbar.tsx, hero.tsx, footer.tsx   # single-file sections stay flat
│       ├── resources/    # multi-file sections get their own folder
│       │   ├── resources-section.tsx
│       │   └── resource-card.tsx
│       ├── faq/
│       │   └── faq-section.tsx
│       └── about/
│           ├── about-card.tsx
│           └── social-icons.tsx   # section-specific icons live with their
│                                     section, not in ui/ — they're brand/copy
│                                     content, not generic primitives
├── lib/
│   ├── fonts.ts        # next/font/google instances
│   ├── prisma.ts        # PrismaClient singleton
│   └── utils.ts         # cn() classname helper
└── config/
    └── site.ts          # nav link section-id constants
```

`ui/` vs `landing/`: `ui/` primitives must stay copy-free and business-logic-free so
the real dashboard can reuse them later. Anything specific to this landing page
(copy, links, layout, section-specific icons) belongs in `landing/`. Within
`landing/`, a section gets its own subfolder once it has more than one file
(e.g. a section component plus its card or icons); single-file sections stay
flat in `landing/` — don't create a folder just to hold one file.

## i18n

- Locales: `en` (default), `ka`. Route segment is `app/[locale]/...`.
- Add new UI copy to **both** `src/messages/en.json` and `ka.json` with identical key
  structure — never hardcode user-facing strings in components.
- Use `Link`/`redirect`/`usePathname`/`useRouter` from `@/i18n/navigation` (not raw
  `next/link` or `next/navigation`) so the locale prefix is preserved automatically.
- Arrays in messages (e.g. `resources.items`, `faq.items`) are read with `t.raw("items")`,
  not `t("items")`.

## Known gotchas already hit in this exact stack

- **`proxy.ts` location**: Next.js 16 renamed `middleware.ts` → `proxy.ts` (exported
  function renamed `middleware` → `proxy`). When using a `src/` directory, `proxy.ts`
  must live **inside `src/`** (next to `app/`), not at the repo root — placing it at
  root silently breaks locale routing (`/` 404s instead of redirecting).
- **Prisma 7 driver adapters**: this Prisma version's `prisma-client` generator requires
  an explicit driver adapter even for local SQLite — `new PrismaClient()` alone throws
  `PrismaClientInitializationError`. Use `@prisma/adapter-better-sqlite3`'s
  `PrismaBetterSqlite3` adapter, as already wired in `src/lib/prisma.ts`.
- Prisma config now lives in `prisma.config.ts` (not inline `url = env(...)` in
  `schema.prisma`), and requires `dotenv/config` to load `.env` outside of Next's own
  env loading.
- The generated Prisma client (`src/generated/prisma`) is gitignored (build artifact) —
  `npm run db:generate` runs automatically via `postinstall`, but run it manually after
  pulling schema changes if needed.

## Data layer

Prisma + local SQLite (`DATABASE_URL="file:./dev.db"` at repo root). No models defined
yet — `Trade`/`Account`/`User` modeling is intentionally deferred to when the real
dashboard is built. Plan is to swap to a hosted Postgres (Neon/Supabase) via the
`datasource`/adapter when deploying (Netlify has no built-in DB), keeping app code
mostly unchanged.

## Scripts

- `npm run dev` / `build` / `start` — standard Next.js
- `npm run lint` / `lint:fix` — ESLint
- `npm run typecheck` — `tsc --noEmit`
- `npm run db:generate` / `db:migrate` / `db:studio` — Prisma
