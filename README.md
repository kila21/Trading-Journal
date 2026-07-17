# Trading Journal

**Live site:** https://trading-journal-free.netlify.app

A personal trading journal for logging trades, tracking performance, and building
consistency — built to sharpen frontend/full-stack skills while practicing my own
trading discipline.

## What you can do

- **Register / log in** with an email and password, and change your password any
  time from the account menu.
- **Log trades** — symbol, direction, entry/exit price, take profit, stop loss,
  contracts, and trading session (Asian, London, NY AM/Lunch/PM) — with P&L
  calculated automatically.
- **See a month at a glance** on a color-coded calendar (green/red by daily P&L),
  with best day, worst day, and current win/loss streak surfaced automatically.
- **Browse and filter your full trade history** on a dedicated Trades page —
  search by symbol/notes, filter by setup, session, symbol, direction, mistake
  tags, plan adherence, and outcome, with live per-option counts.
- **Track performance on the Analytics page** — win rate and P&L by setup and
  session, planned-vs-achieved R, discipline/cost-by-mistake, and wins vs losses.
- **Attach chart screenshots** to a trade, organized per timeframe, so a trade's
  setup and execution stay side by side with the numbers.
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
based on your browser language).

The `postinstall` script runs `prisma generate` automatically. If you ever change
`prisma/schema.prisma`, run:

```bash
npm run db:migrate
```

## Scripts

| Command              | Description                          |
| --------------------- | ------------------------------------- |
| `npm run dev`         | Start the dev server                  |
| `npm run build`        | Production build                      |
| `npm run start`        | Run the production build              |
| `npm run lint`         | Check code style                      |
| `npm run lint:fix`      | Fix code style issues                  |
| `npm run typecheck`     | Check TypeScript types                 |
| `npm run db:migrate`    | Apply a Prisma migration               |
| `npm run db:studio`     | Browse the local database in a GUI      |

## Roadmap

- [x] Landing page, design system, i18n
- [x] Authentication (email/password via Better Auth)
- [x] Trade log — add/edit/view trades, chart image uploads
- [x] Dashboard — calendar, P&L stats, best/worst day, streaks
- [x] Hosted deployment (Netlify + Neon Postgres + Netlify Blobs)
- [x] Analytics page
- [x] Trades page — full trade log with search and filters
- [ ] Brokerage account model
- [ ] Email verification
