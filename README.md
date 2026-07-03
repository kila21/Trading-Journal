# Trading Journal

A web app for logging trades, tracking performance, and building consistency as a
trader.

**Status:** early scaffold — currently just the public landing page (hero, resources,
FAQ) with English/Georgian support. The actual journal (trade log, analytics,
dashboard) hasn't been built yet.

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com) for styling
- [next-intl](https://next-intl.dev) for English / Georgian localization
- [Prisma](https://www.prisma.io) + SQLite for local data storage

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — it redirects to `/en` (or `/ka`
based on your browser language).

The `postinstall` script runs `prisma generate` automatically, so the database client
is ready right after `npm install`. If you ever change `prisma/schema.prisma`, run:

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
- [ ] Authentication (Login/Register are placeholder pages today)
- [ ] Trade log — add/edit/view trades
- [ ] Dashboard — performance stats, equity curve
- [ ] Hosted deployment (Netlify + hosted Postgres)
