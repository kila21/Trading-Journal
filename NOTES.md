# Project Notes (personal reference)

This file is for **you** — a tour of the repo written for someone who knows React
but is new to Next.js and Prisma. (`README.md` is the public-facing project doc,
`CLAUDE.md` is instructions for the AI agent — this one is just for learning the
codebase.)

## Next.js in one minute (for a React dev)

If you've used React with something like Vite or Create React App, you're used to
writing your own routing (React Router, etc.) and your own `index.html` mounting a
single `<App />`. Next.js works differently:

- **Folders are URLs.** `src/app/[locale]/login/page.tsx` becomes the route
  `/en/login`. You don't write a router — the file system *is* the router.
- **Special file names mean something.** `page.tsx` is the component rendered for
  that route. `layout.tsx` is a wrapper that persists across navigations within that
  folder (shared nav bars, fonts, providers, etc. go here).
- **`[locale]` is a dynamic segment** — the square brackets mean "match anything
  here and pass it as a `params` value." That's how one set of files serves both
  `/en/...` and `/ka/...`.
- **Components are Server Components by default.** Unlike a normal React app where
  everything runs in the browser, most components here render on the server and
  send plain HTML — no JS bundle for them at all. You only need `"use client"` at
  the top of a file when it needs browser interactivity (`useState`, `onClick`,
  etc.) — see `src/components/ui/accordion.tsx` and
  `src/components/landing/locale-switcher.tsx` for examples.
- **`src/`** is just an organizational choice Next.js supports — everything under it
  (`app/`, `components/`, `lib/`, etc.) could technically live at the repo root
  instead; keeping it under `src/` just keeps config files (`package.json`,
  `next.config.ts`, etc.) visually separate from application code.

## Folder-by-folder tour

| Folder/file | What it is | Worth opening? |
|---|---|---|
| `src/app/[locale]/` | Every real page lives here. `layout.tsx` sets `<html lang>`, loads fonts, wraps everything in the translations provider. `page.tsx` is the landing page. `login/`, `register/` are stub routes. | **Yes** — start here |
| `src/app/layout.tsx` | The *root* layout Next.js requires above everything else. Deliberately empty (`return children`) because `<html lang>` needs to change per-locale, so the real work happens one level down in `[locale]/layout.tsx`. | Skim |
| `src/app/globals.css` | Tailwind CSS v4 setup + the design tokens (colors, fonts) for the whole app. | **Yes** |
| `src/i18n/` | Configuration for `next-intl` (the translation library). `routing.ts` declares the two supported locales (`en`, `ka`). `navigation.ts` gives you locale-aware versions of `Link`/`router` to use instead of Next's defaults. `request.ts` tells Next which JSON file to load per request. | Yes, if touching i18n |
| `src/messages/en.json`, `ka.json` | The actual text shown on the site, one file per language. Same keys in both files, different values. | **Yes** — this is where all the copy lives |
| `src/proxy.ts` | Next.js's request-interception file (was called `middleware.ts` before Next 16). Runs before every page load and decides which locale (`en`/`ka`) to route to. | Skim |
| `src/components/ui/` | Generic, reusable pieces (Button, Card, Accordion) with **no text and no page-specific logic** — same idea as a component library. These will get reused when the real dashboard is built later. | Yes |
| `src/components/landing/` | Components specific to *this* landing page (Navbar, Hero, FAQ section, etc.) — these pull their text from `src/messages/`. | Yes |
| `src/lib/fonts.ts` | Loads the two fonts (Space Grotesk, Noto Sans Georgian) via Next's built-in font optimizer. | Skim |
| `src/lib/prisma.ts` | The database connection — see the Prisma section below. | **Yes** |
| `src/lib/utils.ts` | One tiny helper (`cn()`) for merging CSS class strings. Not React-specific, just a convenience. | Skip |
| `src/config/site.ts` | A couple of constants (which nav links exist). Kept separate from components so they're easy to find/change. | Skip |
| `public/` | Static files served as-is at the site root (e.g. `public/resources/placeholder-1.svg` is served at `/resources/placeholder-1.svg`). Same idea as `public/` in Create React App. | Skip |
| `next.config.ts` | Next.js's main config file. Currently just wires up `next-intl`. | Skim |
| `tsconfig.json` | Standard TypeScript config. Notable bit: the `@/*` path alias, so `@/lib/prisma` means `src/lib/prisma.ts` anywhere in the codebase. | Skim |
| `postcss.config.mjs` | One line — tells Tailwind v4 how to plug into the CSS build. | Skip |
| `eslint.config.mjs` | Code-style rules. | Skip |
| `package.json` | Dependencies + the `npm run ...` scripts. | Yes, know what scripts exist |
| `.env` / `.env.example` | `.env` holds your actual local secrets/config (currently just `DATABASE_URL`) and is gitignored — never committed. `.env.example` is the same file with safe placeholder values, committed so anyone cloning the repo knows what variables they need to set. | Skim |

## `.next/` — what is this and why so many files?

This folder didn't exist in a typical Create React App/Vite project the same way,
so it's worth explaining directly: **`.next/` is Next.js's build output and cache.
Every file in it is auto-generated — you never create or edit anything here by
hand, and it's gitignored (never committed).**

It gets created the moment you run `npm run dev` or `npm run build`, and it's
completely safe to delete at any time — Next just regenerates it (`rm -rf .next`
is a common "something looks stale, force a clean rebuild" fix; we used it
ourselves a few times while setting this project up).

What's actually inside, briefly:

- **`server/` and `static/`** — the actual compiled output: server-rendered page
  code and the static JS/CSS bundles sent to the browser.
- **`cache/`** — Next's incremental build cache. This is what makes the *second*
  `npm run dev`/`build` much faster than the first — it remembers what it already
  compiled.
- **`types/`** — auto-generated TypeScript types for your routes (e.g. so
  `params: Promise<{ locale: string }>` type-checks correctly). Generated, not
  hand-written.
- **`dev/`** — Turbopack's (the dev-mode bundler) own output, kept separate from the
  production `build/` output.
- **The `*-manifest.json` files** (`build-manifest.json`, `routes-manifest.json`,
  `prerender-manifest.json`, etc.) — bookkeeping Next.js reads at runtime to know
  which routes exist, which are static vs. dynamic, which JS files a given page
  needs, and so on.
- **`BUILD_ID`, `trace`, `trace-build`** — an identifier for "this specific build"
  plus performance tracing data, mostly useful for debugging slow builds.

**Takeaway:** if `.next/` looks huge or confusing, that's normal — it's the
equivalent of a `dist/` folder, just with a lot more internal bookkeeping than a
typical Vite build produces. Ignore it unless you're specifically debugging a
build issue.

## Prisma — what exists today vs. what's still missing

You correctly sensed there's "no logic yet" — here's exactly what that means.

**The one-sentence idea:** instead of writing SQL by hand, you describe your
database tables in a simple schema file, and Prisma generates a fully-typed
JavaScript client so you query the database like `prisma.trade.findMany()`.

Here's every Prisma-related file/folder and what it does:

- **`prisma/schema.prisma`** — the schema file itself. Right now it only has
  `generator`/`datasource` blocks (which database engine to use, where to generate
  the client) and **zero models**. This is the "no logic yet" part — there's no
  `model Trade { ... }` block defining what a trade even looks like. That gets
  added once the real trade-log feature is built.
- **`prisma.config.ts`** (repo root) — a newer Prisma config file (Prisma 7) that
  tells the CLI where to find the schema, where to put migrations, and where to
  read `DATABASE_URL` from.
- **`.env`** — contains `DATABASE_URL="file:./dev.db"`, i.e. "the database is a
  local SQLite file called `dev.db` in this folder." No server, no separate
  database installation — it's just a file on disk.
- **`dev.db`** — the actual SQLite database file. **It doesn't exist right now** —
  it gets created automatically the first time you run `npm run db:migrate`.
- **`prisma/migrations/`** — also doesn't exist yet. A "migration" is a small,
  timestamped SQL file that records *one change* to the schema over time (e.g.
  "add a `trades` table"). Together they're a reproducible history of every schema
  change ever made. This folder appears the first time you run `npm run db:migrate`.
- **`src/generated/prisma/`** — the actual generated client code (`client.ts`
  exports the `PrismaClient` class, `models.ts`/`enums.ts` hold the typed model
  definitions). This is 100% auto-generated from `schema.prisma` — never hand-edit
  it. It's gitignored, and regenerated automatically after `npm install` (via the
  `postinstall` script) or manually via `npm run db:generate`.
- **`src/lib/prisma.ts`** — the *one* hand-written file in this whole list. It sets
  up a single shared database connection (a "singleton") so that Next's dev-mode
  hot-reload doesn't accidentally open a new connection every time you save a
  file. It also configures the `@prisma/adapter-better-sqlite3` driver — Prisma 7
  requires you to explicitly pass a database driver like this even for local
  SQLite, which is a newer requirement than most Prisma tutorials online will show.

**What's genuinely missing (future work, not a mistake):** no `Trade`/`Account`/
`User` models are defined, and no code anywhere in the app calls
`prisma.<something>.findMany()`/`.create()` etc. That's exactly what "building the
real trading journal" will add — a schema with real models, a migration, and
actual pages/API routes that read and write data through `src/lib/prisma.ts`.

## Phase 2 progress (as of 2026-07-04)

Phase 1 (landing page, i18n, design system) is done. Steps 1–5 below (auth strategy
through route protection) are **done** — `/login` and `/register` are real now, backed
by [Better Auth](https://better-auth.com), with a placeholder `/dashboard` to redirect
to and prove the session/route-protection flow end-to-end.

1. ~~Decide the auth strategy~~ **Done — Better Auth**, not Auth.js/NextAuth. The
   landscape shifted since this plan was first drafted: as of Sept 2025 the Better Auth
   team took over Auth.js maintenance, and Auth.js v5 is now in security-patch-only
   mode with its own maintainers pointing new projects at Better Auth. Roll-your-own was
   also considered and rejected — no benefit over a self-hosted library that gives the
   same data ownership without hand-building password hashing/session/CSRF correctness.

2. ~~Form validation on Login/Register~~ **Done, without `zod`.** Better Auth validates
   email/password server-side; the one extra check this app needed (password-confirm
   match on register) is a one-line comparison in `register-form.tsx`. `zod` is still a
   natural addition once real dashboard forms (trade entry) exist.

3. ~~`User` model + first Prisma migration~~ **Done.** Better Auth generates its own
   `User`/`Session`/`Account`/`Verification` models (via
   `npx @better-auth/cli generate --config src/lib/auth.ts`); first-ever migration ran
   via `npm run db:migrate`, creating `dev.db` and `prisma/migrations/`.
   **Gotcha hit along the way**: Prisma 7's client generator ships as an ES module and
   silently produces `undefined` for every model delegate (`prisma.user`, etc.) unless
   the root `package.json` has `"type": "module"` — no error, it just fails at the call
   site. That's now set; see `CLAUDE.md`'s gotchas list.

4. ~~Wire real register/login~~ **Done**, via client-side calls to Better Auth's React
   client (`signIn.email`/`signUp.email` in `src/lib/auth-client.ts`) from client
   components in `src/components/auth/`, not Server Actions — Better Auth's client SDK
   already handles the cookie/session dance against `/api/auth/[...all]`.

5. ~~Route protection~~ **Done, two-layered.** `src/proxy.ts` does an optimistic
   cookie-presence check (`getSessionCookie`) to bounce logged-out visitors from
   `/dashboard`; `src/app/[locale]/dashboard/page.tsx` does the authoritative DB-backed
   `auth.api.getSession()` check. `/dashboard` itself is just a placeholder ("logged in
   as {email}" + logout) — not the real dashboard.

6. ~~`Trade` schema~~ **Done** — see Phase 3 below. `Account` (brokerage/portfolio
   account, distinct from Better Auth's own `Account` model) is still deferred until
   multi-account support is actually needed.

7. **Testing setup.** Still not configured (no Jest/Vitest/Playwright). Worth adding
   before more auth logic lands (password reset, email verification, OAuth) — auth bugs
   caught after the fact are much more expensive than a bug in landing-page copy.

8. **Hosted deployment swap** (SQLite → hosted Postgres via Neon/Supabase, per
   `CLAUDE.md`) — not urgent until more of the above is real and working locally.
   Note Better Auth's `prismaAdapter(prisma, { provider: "sqlite" })` call in
   `src/lib/auth.ts` will need its `provider` updated to `"postgresql"` alongside the
   `datasource`/adapter swap.

9. **Not done yet, worth deciding next**: password reset flow, email verification
   (currently off — registering logs you straight in), and whether/when to add OAuth
   providers (Better Auth makes this a small `socialProviders` config addition).

## Phase 3 progress (as of 2026-07-05)

The real dashboard has started: a collapsible sidebar, a Net P&L summary, a month
calendar color-coded by realized P&L, and full trade create/edit/review via modals —
all backed by a real `Trade` model now, not mock data.

- **`Trade` model** (`prisma/schema.prisma`): `symbol`, `direction` (plain `String`,
  `"long" | "short"` — SQLite's Prisma connector doesn't support enums), `entryPrice`,
  `exitPrice`, `takeProfit`/`stopLoss` (optional), `size`, `pnl`, `tradeDate`, `notes`.
  `pnl` is **manually entered as a magnitude, sign auto-calculated**
  (`trade-form.tsx`'s `computePnlSign`) from direction + entry/exit price — not derived
  from `entryPrice`/`exitPrice`/`size` directly, since real P&L depends on contract
  point value / lot size that isn't modeled (this app spans futures, forex, and
  crypto). Take profit/stop loss get a non-blocking warning (not enforced) if they're
  on the wrong side of entry for the direction, since a trailing stop moved into
  profit can legitimately end up past entry.
- **API**: `src/app/api/trades/route.ts` (GET by year/month, POST) and
  `src/app/api/trades/[id]/route.ts` (PATCH, DELETE), all scoped to the session
  user via `auth.api.getSession`, mirroring the Better Auth route's pattern. Hand-
  rolled validation in `src/lib/validate-trade.ts` — no `zod` yet (see item 2 above);
  still the natural place to add it if the form grows more complex.
  **Gotcha hit along the way**: adding a Prisma model to an already-running dev
  server doesn't work without a restart — `src/lib/prisma.ts` caches the client on
  `globalThis` for HMR, so an already-running process keeps the pre-migration client
  shape in memory. See `CLAUDE.md`'s gotchas list.
- **Modals**: click an empty calendar day → create form opens directly; click a day
  with trades → a read-only review modal lists them with "Add trade"/"Edit" actions.
  `src/components/ui/dialog.tsx` wraps the native `<dialog>` element (no new
  dependency) — mount/unmount is the only source of truth for open/closed (an
  earlier version tried to sync an `open` prop against the dialog's own native
  state and the modal would stop reopening after a close; letting React's own
  mount lifecycle own it sidesteps that entirely).
- **`src/components/ui/info-tooltip.tsx`**: small "!" icon for field hints (used by
  Size and P&L). Positioned via measured `getBoundingClientRect()` +
  `position: fixed`, not CSS centering — a plain absolutely-positioned tooltip
  escaped/clipped unpredictably inside the scrollable dialog depending on where the
  icon sat; `fixed` positioning escapes that overflow/clipping model entirely.
- Not done yet: image/screenshot upload on trades (deferred — needs a storage
  decision, local disk vs. cloud, that hasn't been made), and the brokerage
  `Account` model from item 6 above.

## If you only open 7 files, open these

1. `src/app/[locale]/layout.tsx` — see how fonts, translations, and `<html lang>` connect
2. `src/app/[locale]/page.tsx` — see how the landing page composes its sections
3. `src/i18n/routing.ts` — the two supported locales, declared in one place
4. `src/proxy.ts` — how requests get routed to `/en` or `/ka`
5. `src/app/globals.css` — the design tokens (colors/fonts) for the whole site
6. `prisma/schema.prisma` — the (currently empty) database schema
7. `src/lib/prisma.ts` — how the app will eventually talk to the database
