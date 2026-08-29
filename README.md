# Trading Journal

**Live site:** https://trading-journal-free.netlify.app

A personal trading journal for logging trades, tracking performance, and building
consistency — built to sharpen frontend/full-stack skills while practicing my own
trading discipline.

## What you can do

- **Register / log in** with an email and password, and change your password any
  time from the account menu.
- **Log trades** — symbol, direction, entry/exit price, take profit, stop loss,
  contracts, contract type (E-mini / Micro), trading session, plus how you felt
  and any mistakes. P&L and dollar risk are derived from the prices, contract
  count, and the instrument's point value — no need to type them.
- **Log multi-day (swing) holds** — the exit can fall on a later day than the entry.
- **See a month at a glance** on a color-coded calendar (green/red by daily P&L),
  with an agenda list and equity-curve view, and best day / worst day / current
  streak surfaced automatically.
- **Browse and filter your full trade history** on a dedicated Trades page —
  search by symbol/notes, filter by setup, session, symbol, direction, mistake
  tags, emotions, plan adherence, and outcome, with live per-option counts.
  Export to CSV.
- **Build a playbook** — define your setups with entry conditions, min R, and
  target sessions, then see win rate, expectancy, and per-condition compliance
  for each one.
- **Track performance on the Analytics page** — win rate and P&L by setup,
  session, symbol, direction, day of week, and hour; R-multiple distribution;
  hold-time buckets; planned-vs-achieved R; cost by mistake; performance by
  emotion; and consecutive-trade streaks — over the last month, 90 days, YTD,
  or all time.
- **Attach chart screenshots** to a trade, organized per timeframe (paste,
  drag-and-drop, or pick a file), so a trade's setup and execution stay side by
  side with the numbers.
- **Use it in English or Georgian (ქართული)** — every page is fully translated.

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com) for styling
- [next-intl](https://next-intl.dev) for English / Georgian localization
- [Prisma](https://www.prisma.io) + [Neon](https://neon.tech) Postgres for data
- [Better Auth](https://better-auth.com) for email/password authentication
- Deployed on [Netlify](https://netlify.com), with [Netlify Blobs](https://docs.netlify.com/build/data-and-storage/netlify-blobs/)
  storing trade chart images in production

## Getting started

Copy `.env.example` to `.env` and set `DATABASE_URL` to a Neon Postgres connection
string (a free dev branch works well — see `.env.example` for the expected format),
plus a `BETTER_AUTH_SECRET`. Then:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — it redirects to `/en` (or `/ka`
based on your browser language). The `postinstall` script runs `prisma generate`
automatically.

## Scripts

| Command               | Description                                          |
| --------------------- | --------------------------------------------------- |
| `npm run dev`         | Start the dev server                                |
| `npm run build`       | Production build                                    |
| `npm run start`       | Run the production build                            |
| `npm run lint`        | Check code style                                    |
| `npm run lint:fix`    | Fix code style issues                               |
| `npm run typecheck`   | Check TypeScript types                              |
| `npm run db:generate` | Regenerate the Prisma client                        |
| `npm run db:migrate`  | Create and apply a Prisma migration (dev)           |
| `npm run db:studio`   | Browse the database in a GUI                         |
| `npm run build:netlify` | `prisma migrate deploy && next build` (deploy only) |

If you change `prisma/schema.prisma`, run `npm run db:migrate` and then **restart
the dev server** — the Prisma client is cached in memory and won't pick up new
columns otherwise.

## Roadmap

- [x] Landing page, design system, i18n
- [x] Authentication (email/password via Better Auth)
- [x] Trade log — add/edit/view trades, chart image uploads
- [x] Dashboard — calendar, P&L stats, best/worst day, streaks
- [x] Hosted deployment (Netlify + Neon Postgres + Netlify Blobs)
- [x] Analytics page
- [x] Trades page — full trade log with search and filters
- [x] Deeper analytics — R distribution, day/hour/hold-time/symbol/direction breakdowns, streaks
- [x] Multi-day (swing) holds
- [x] Dedicated trade pages (new / detail / edit) instead of modals
- [x] Per-instrument contract sizing — derived P&L and dollar risk from point values
- [ ] Brokerage account model
- [ ] Email verification
