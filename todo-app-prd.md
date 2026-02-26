# PRD: Todo List Application — Production-Grade Challenge

## Overview

Build a production-quality Todo application using TanStack Start with SSR, infinite scroll, optimistic updates, offline support, and graceful degradation. This document defines architecture, data flow, component contracts, and all engineering decisions required to implement the system end-to-end.

---

## Design System

Use the provided CSS token file verbatim. Import the theme variables into `globals.css`. Use `Nunito` (sans), `PT Serif` (serif), and `JetBrains Mono` (mono). All Shadcn/UI components inherit these tokens automatically. Light/dark mode is supported via the `.dark` class on `<html>`.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | TanStack Start (Vite-based SSR/CSR hybrid) |
| Routing | TanStack Router (file-based) |
| Server Functions | TanStack Start `createServerFn` |
| Data Fetching / Caching | TanStack Query v5 |
| Database | PostgreSQL |
| ORM | Drizzle ORM |
| UI Components | Shadcn/UI |
| Styling | Tailwind CSS v4 |
| Local State | Zustand |
| Offline Storage | IndexedDB via `idb` library |
| Virtualization | TanStack Virtual |
| Validation | Zod |
| Type Safety | TypeScript strict mode |

---

## Project Structure

```
src/
├── app/
│   ├── routes/
│   │   ├── __root.tsx               # Root layout, QueryClient provider, theme
│   │   ├── todos/
│   │   │   ├── index.tsx            # /todos route (SSR + infinite scroll list)
│   │   │   └── new.tsx              # /todos/new route (create form)
│   ├── components/
│   │   ├── todos/
│   │   │   ├── TodoList.tsx         # Container: wires query + virtualizer
│   │   │   ├── TodoItem.tsx         # Presentational: single row, checkbox
│   │   │   ├── TodoForm.tsx         # Presentational: create form fields
│   │   │   ├── TodoSkeleton.tsx     # Loading placeholder rows
│   │   │   └── OfflineBanner.tsx    # Network status UI
│   ├── hooks/
│   │   ├── useTodos.ts              # Infinite query hook
│   │   ├── useCreateTodo.ts         # Create mutation hook
│   │   ├── useToggleTodo.ts         # Toggle mutation hook
│   │   ├── useNetworkStatus.ts      # Online/offline detection
│   │   └── useIntersectionObserver.ts # Sentinel observer
│   ├── queries/
│   │   ├── todoKeys.ts              # Query key factory
│   │   ├── todoQueries.ts           # Query/infiniteQuery definitions
│   │   └── todoMutations.ts         # Mutation definitions
│   ├── services/
│   │   ├── todo.service.ts          # Client-side API service (calls server fns)
│   │   └── offline.service.ts       # IndexedDB read/write abstraction
│   ├── server/
│   │   ├── functions/
│   │   │   ├── todos.ts             # createServerFn handlers
│   │   ├── db/
│   │   │   ├── schema.ts            # Drizzle schema
│   │   │   ├── client.ts            # DB connection singleton
│   │   │   └── migrations/          # Drizzle migration files
│   │   └── services/
│   │       └── todo.server.ts       # Pure server-side business logic
│   ├── store/
│   │   └── uiStore.ts               # Zustand: UI-only state (filter, sort, pending queue)
│   ├── types/
│   │   └── todo.ts                  # Shared domain types + Zod schemas
│   └── lib/
│       ├── queryClient.ts           # QueryClient singleton + config
│       └── utils.ts                 # cn(), formatDate(), etc.
```

---

## Database Schema

File: `src/server/db/schema.ts`

```typescript
import { pgTable, uuid, text, boolean, timestamp, integer } from 'drizzle-orm/pg-core';

export const todos = pgTable('todos', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  isCompleted: boolean('is_completed').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

Indexes: Add a composite index on `(is_completed, created_at DESC)` for efficient paginated queries.

---

## Shared Types

File: `src/types/todo.ts`

```typescript
import { z } from 'zod';

export const TodoSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(280),
  description: z.string().max(1000).optional().nullable(),
  isCompleted: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Todo = z.infer<typeof TodoSchema>;

export const CreateTodoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(280),
  description: z.string().max(1000).optional(),
});

export type CreateTodoInput = z.infer<typeof CreateTodoSchema>;

export const PaginatedTodosSchema = z.object({
  items: z.array(TodoSchema),
  nextCursor: z.string().nullable(),
  total: z.number(),
});

export type PaginatedTodos = z.infer<typeof PaginatedTodosSchema>;

export const PAGE_SIZE = 25;
```

---

## Server Layer

### Server Business Logic

File: `src/server/services/todo.server.ts`

This file contains pure functions with no HTTP concerns. It only talks to the DB via Drizzle.

```typescript
// All functions are async, typed with Drizzle inferred types
// getTodos(cursor, limit): PaginatedTodos
// createTodo(input: CreateTodoInput): Todo
// toggleTodo(id: string): Todo
// getTodoById(id: string): Todo | null
```

**getTodos** implementation notes:
- Use cursor-based pagination (cursor = last item's `createdAt` ISO string + id, encoded as base64).
- Query: `WHERE created_at < :cursor ORDER BY created_at DESC LIMIT :limit + 1`. If result length > limit, pop last item and set `nextCursor`.
- This prevents the page-drift problem that offset pagination causes when items are added/removed.

### Server Functions

File: `src/server/functions/todos.ts`

Use TanStack Start's `createServerFn`. Each function validates input with Zod before passing to the server service. Never expose raw Drizzle errors to the client.

```typescript
export const fetchTodosServerFn = createServerFn({ method: 'GET' })
  .validator(z.object({ cursor: z.string().optional(), limit: z.number().default(PAGE_SIZE) }))
  .handler(async ({ data }) => {
    return todoServerService.getTodos(data.cursor, data.limit);
  });

export const createTodoServerFn = createServerFn({ method: 'POST' })
  .validator(CreateTodoSchema)
  .handler(async ({ data }) => {
    return todoServerService.createTodo(data);
  });

export const toggleTodoServerFn = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    return todoServerService.toggleTodo(data.id);
  });
```

Error handling: Wrap handler bodies in try/catch. Throw structured errors with a code and message. The client service layer maps these to user-facing messages.

---

## Client Service Layer

File: `src/services/todo.service.ts`

This is the only place in the client that calls server functions. Hooks and queries never call server functions directly — they call this service. This indirection enables easy mocking, offline fallback injection, and retry logic.

```typescript
export const todoService = {
  async getTodos(cursor?: string): Promise<PaginatedTodos> {
    // Calls fetchTodosServerFn
    // On network error, falls through to offlineService.getTodos()
  },

  async createTodo(input: CreateTodoInput): Promise<Todo> {
    // Calls createTodoServerFn
    // On network error, queues to offlineService.queueCreate(input)
  },

  async toggleTodo(id: string): Promise<Todo> {
    // Calls toggleTodoServerFn
    // On network error, queues to offlineService.queueToggle(id)
  },
};
```

---

## Offline Service

File: `src/services/offline.service.ts`

Uses the `idb` library to wrap IndexedDB.

**Stores:**
- `todos-cache`: Mirrors the server list, keyed by todo ID. Populated on every successful fetch.
- `pending-queue`: Array of queued mutations (type: `create | toggle`, payload, timestamp, tempId for optimistic items).

**Behavior:**
- On app load, `useNetworkStatus` registers an `online` event listener. When the browser comes back online, Zustand's `uiStore` sets `isOnline = true`, which triggers `offlineService.flushQueue()`. This replays queued mutations in order and then invalidates the todo query.
- `flushQueue` processes items sequentially (not in parallel) to preserve causal ordering.
- Items created offline get a `tempId` prefixed with `offline-`. When flushed, the server returns a real ID; the cache is updated and the query key for the temp item is cleaned up.

```typescript
export const offlineService = {
  async seedCache(todos: Todo[]): Promise<void>,
  async getCachedTodos(): Promise<Todo[]>,
  async upsertCached(todo: Todo): Promise<void>,
  async queueCreate(input: CreateTodoInput, tempId: string): Promise<void>,
  async queueToggle(id: string): Promise<void>,
  async flushQueue(queryClient: QueryClient): Promise<void>,
  async clearQueue(): Promise<void>,
};
```

---

## Query Key Factory

File: `src/queries/todoKeys.ts`

```typescript
export const todoKeys = {
  all: () => ['todos'] as const,
  lists: () => [...todoKeys.all(), 'list'] as const,
  list: (filters?: object) => [...todoKeys.lists(), filters ?? {}] as const,
  detail: (id: string) => [...todoKeys.all(), 'detail', id] as const,
};
```

---

## TanStack Query Definitions

File: `src/queries/todoQueries.ts`

```typescript
export const todosInfiniteQueryOptions = queryOptions({
  queryKey: todoKeys.lists(),
  queryFn: ({ pageParam }) => todoService.getTodos(pageParam as string | undefined),
  initialPageParam: undefined,
  getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  staleTime: 1000 * 30,          // 30s — don't refetch if data is fresh
  gcTime: 1000 * 60 * 5,         // 5 min garbage collection
  refetchOnWindowFocus: false,    // prevent jarring mid-scroll refetches
  retry: (failureCount, error) => {
    if (isOfflineError(error)) return false; // don't retry offline errors
    return failureCount < 2;
  },
});
```

File: `src/queries/todoMutations.ts`

**createTodo mutation:**
- `onMutate`: Generate `tempId`, construct optimistic todo, call `queryClient.cancelQueries`, snapshot old data via `getQueryData`, inject optimistic item at the top of page 0, return snapshot as context.
- `onError`: Roll back using the snapshot from context.
- `onSettled`: `queryClient.invalidateQueries({ queryKey: todoKeys.lists() })` to reconcile server state.

**toggleTodo mutation:**
- `onMutate`: Do NOT invalidate or re-fetch. Directly call `queryClient.setQueryData` to flip `isCompleted` on the matching item inside the infinite pages structure. Return snapshot.
- `onError`: Roll back using snapshot.
- `onSettled`: Targeted invalidation of just that todo's detail key (no full list refetch).

---

## Hooks

### `useTodos`

File: `src/hooks/useTodos.ts`

Wraps `useInfiniteQuery` with `todosInfiniteQueryOptions`. Derives a flat `todos` array from `data.pages`. Returns `{ todos, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, error }`.

### `useCreateTodo`

File: `src/hooks/useCreateTodo.ts`

Wraps the create mutation. On success, navigates to `/todos`. Reads from `uiStore` to know whether to queue offline.

### `useToggleTodo`

File: `src/hooks/useToggleTodo.ts`

Wraps the toggle mutation. Pure cache surgery — no navigation side effects.

### `useNetworkStatus`

File: `src/hooks/useNetworkStatus.ts`

Listens to `window.online` / `window.offline` events and `navigator.onLine`. Syncs to `uiStore.isOnline`. On transition to online, triggers `offlineService.flushQueue`.

### `useIntersectionObserver`

File: `src/hooks/useIntersectionObserver.ts`

Generic hook. Accepts a `ref` and a callback. Uses `IntersectionObserver` with `rootMargin: '200px'` (pre-fetches before the sentinel is fully visible). Cleans up on unmount.

---

## Zustand Store

File: `src/store/uiStore.ts`

Zustand is used **only** for UI state that is not server-derived and must be shared across components without prop drilling.

```typescript
interface UiStore {
  isOnline: boolean;
  setIsOnline: (v: boolean) => void;
  pendingQueueCount: number;         // How many offline mutations are queued
  setPendingQueueCount: (n: number) => void;
  hasFlushedQueue: boolean;          // Prevent double-flush on reconnect
  setHasFlushedQueue: (v: boolean) => void;
}
```

Do NOT put todos, loading states, or pagination state in Zustand. That belongs in TanStack Query.

---

## QueryClient Configuration

File: `src/lib/queryClient.ts`

```typescript
export const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      gcTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
      networkMode: 'offlineFirst', // Allow queries to run using cached data offline
    },
    mutations: {
      networkMode: 'offlineFirst',
      retry: 0, // Mutations do not auto-retry; offline queue handles this
    },
  },
});
```

---

## Routing & SSR

### `/todos` Route

File: `src/app/routes/todos/index.tsx`

```typescript
export const Route = createFileRoute('/todos/')({
  loader: async ({ context }) => {
    // Prefetch page 1 on the server and dehydrate into HTML
    await context.queryClient.prefetchInfiniteQuery(todosInfiniteQueryOptions);
  },
  component: TodosPage,
});
```

The `loader` runs on the server. The first page of todos is embedded in the HTML. The client hydrates and never makes an extra network call for page 1.

### `/todos/new` Route

File: `src/app/routes/todos/new.tsx`

No SSR loader needed. Renders `TodoForm`. On submit, calls `useCreateTodo`. Shows inline validation errors from Zod. Navigates to `/todos` on success.

---

## Component Architecture

### `TodoList` (Container)

Responsibilities: calls `useTodos`, sets up `useVirtualizer` from TanStack Virtual, renders the sentinel `<div>` at the bottom and wires `useIntersectionObserver` to it.

**Virtualization strategy:**
- Use `useVirtualizer` with an estimated item size of `72px`.
- Render only the visible window + overscan of 5 items above/below.
- This means even with 10,000 items in memory, the DOM only holds ~20 nodes.
- Sentinel element sits outside the virtualizer, always at the true bottom of the scrollable area.
- Trigger `fetchNextPage` when sentinel enters viewport AND `hasNextPage && !isFetchingNextPage`.

```
[Virtual List Container]
  [Spacer top]
  [Rendered virtual items only]
  [Spacer bottom]
[Sentinel div] ← IntersectionObserver target
[Spinner] ← shown when isFetchingNextPage
```

### `TodoItem` (Presentational)

Props: `todo: Todo`, `onToggle: (id: string) => void`. Renders a card with a Shadcn `Checkbox`, the title, optional description, and a relative timestamp. The checkbox `onCheckedChange` calls `onToggle`. Optimistic items (tempId prefix `offline-`) render with a subtle pulsing ring using Tailwind's `animate-pulse` on the checkbox.

### `TodoForm` (Presentational)

Props: `onSubmit: (data: CreateTodoInput) => void`, `isPending: boolean`, `error: string | null`. Uses Shadcn `Input`, `Textarea`, `Button`. Client-side validation via `react-hook-form` + Zod resolver before calling `onSubmit`.

### `OfflineBanner`

Reads `uiStore.isOnline` and `uiStore.pendingQueueCount`. Renders a fixed bottom bar when offline: "You're offline. X changes will sync when you reconnect." Uses `aria-live="polite"` for accessibility. Animates in/out with Tailwind transition classes.

---

## Infinite Scroll & Virtualization — Detailed Decisions

**When to fetch:** Pre-fetch when sentinel is 200px before entering viewport (`rootMargin: '0px 0px 200px 0px'`). This gives the network time to respond before the user hits the bottom, making scroll feel seamless.

**Why cursor-based over offset:** Offset pagination breaks when new items are inserted (page 2 may skip or repeat items). Cursors are stable because they anchor to a specific record.

**Why virtualizer + infinite query:** Without virtualization, 500+ DOM nodes degrade scroll performance. With TanStack Virtual, the DOM is always O(visible items). The infinite query keeps all page data in memory so the virtualizer can reference any item without re-fetching.

**Estimated vs measured sizes:** Use estimated size of 72px. For variable-height items (long descriptions), enable `measureElement` on the virtualizer to measure actual rendered height and recalculate positions dynamically.

---

## Error Handling Matrix

| Scenario | Behavior |
|---|---|
| Network drops during `fetchNextPage` | Query enters `error` state. Show inline "Failed to load more" with a retry button. Do not lose already-loaded pages. |
| Network drops during create | `onError` fires, rolls back optimistic item. Mutation queued in IndexedDB pending queue. `OfflineBanner` shows count. |
| Network drops during toggle | `onError` fires, rolls back checkbox state. Queued in IndexedDB. |
| Server returns 500 | Show Shadcn `Toast` with error message. Log error to console (hook in for Sentry in prod). |
| DB constraint violation on create | Server function throws structured error, client shows inline form error. |
| Reconnect with queued items | `useNetworkStatus` detects online event → `offlineService.flushQueue()` → invalidate queries → list refreshes with real server state. |
| Stale infinite data on tab refocus | `refetchOnWindowFocus: false` prevents jarring mid-scroll refetch. User can manually pull-to-refresh (future enhancement). |

---

## Performance Checklist

- SSR prefetches page 1 → zero loading state on initial render.
- TanStack Virtual limits DOM nodes to ~20 regardless of list size.
- `networkMode: offlineFirst` lets TanStack Query serve cached data without a loading spinner when offline.
- `staleTime: 30s` prevents redundant background refetches during normal use.
- Toggle mutation does surgical cache update, no list refetch.
- `refetchOnWindowFocus: false` prevents scroll jank when user alt-tabs back.
- Cursor pagination prevents duplicate/skipped items as the list changes.
- IndexedDB cache seeds the UI instantly on hard refresh when offline.
- `rootMargin: 200px` on sentinel preloads next page before user reaches the bottom.

---

## Accessibility

- All interactive elements are keyboard navigable.
- Checkboxes use `aria-label` with the todo title: `aria-label={`Mark "${todo.title}" as ${todo.isCompleted ? 'incomplete' : 'complete'}`}`.
- `OfflineBanner` uses `role="status"` and `aria-live="polite"`.
- Loading spinners have `aria-label="Loading more todos"`.
- Form fields have associated `<label>` elements.
- Error messages use `role="alert"`.

---

## Environment Variables

```
DATABASE_URL=postgresql://user:password@localhost:5432/todos
```

---

## Implementation Order for Cursor

1. Initialize TanStack Start project, configure Tailwind v4, install Shadcn/UI, paste design tokens into `globals.css`.
2. Setup Drizzle schema, `DATABASE_URL`, run migration.
3. Implement `src/server/services/todo.server.ts` (pure DB functions).
4. Implement `src/server/functions/todos.ts` (server functions with Zod validation).
5. Implement `src/types/todo.ts` and `src/lib/queryClient.ts`.
6. Implement `src/services/offline.service.ts` (IndexedDB abstraction).
7. Implement `src/services/todo.service.ts` (calls server fns, falls back to offline service).
8. Implement query keys, query options, and mutation definitions.
9. Implement all hooks.
10. Implement `uiStore.ts`.
11. Build `TodoItem`, `TodoForm`, `TodoSkeleton`, `OfflineBanner` presentational components.
12. Build `TodoList` container with virtualizer + sentinel.
13. Implement `/todos` route with SSR loader.
14. Implement `/todos/new` route.
15. Wire `useNetworkStatus` in root layout.
16. End-to-end test: create, toggle, scroll, offline queue, reconnect flush.
