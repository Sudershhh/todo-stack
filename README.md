# Todo Stack

A personal todo app with offline support, built with TanStack Start.

## Features

- List todos with infinite scroll and virtual list
- Create todo (title + optional description)
- Toggle complete
- Offline support: read from IndexedDB cache; create/toggle queued and synced on reconnect
- Prefetch on `/todos`; form validation (Zod); error and empty states

## Tech stack

TanStack Start (React, Router, Query, server functions), Drizzle + PostgreSQL, Tailwind, Zustand, Motion, React Hook Form + Zod, IndexedDB (idb), Vitest.

## How to run

```bash
npm install
npm run dev
```

App runs at [http://localhost:3000](http://localhost:3000). Tests: `npm run test`. Build: `npm run build`; preview: `npm run preview`.

## Env

Set a PostgreSQL connection string (used in `src/server/db/client.ts`):

```bash
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
```

## Tradeoffs

- **Offline** — Optimistic create/toggle with temp IDs; mutations queued in IndexedDB and flushed in order on reconnect. First failure stops the flush; one message shown (no per-item conflict UI).
- **List** — Cursor-based pagination (server page size 25, UI fetches 8 at a time); virtual list for long lists. Offline shows full cached list (no pagination).
- **Queries** — No refetch on window focus; limited retries. Fits a read-heavy personal todo app.
- **Mutations** — No automatic retry; user or queue handles retries.
- **Single-tenant** — No auth; one DB per deployment. For personal or single-team use.

## Design assumptions

- Single-user, personal task list
- Offline is best-effort (sync on reconnect only)
- Create + toggle only (no delete/edit in scope)

