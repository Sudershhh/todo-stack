import { Link, createFileRoute } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";

import { todosInfiniteQueryOptions } from "@/queries/todoQueries";
import { TodoList } from "@/components/todos/TodoList";
import { OfflineBanner } from "@/components/todos/OfflineBanner";

export const Route = createFileRoute("/todos/")({
  loader: async ({ context }) => {
    const queryClient = (context as { queryClient: QueryClient }).queryClient;
    await queryClient.prefetchInfiniteQuery(todosInfiniteQueryOptions);
  },
  component: TodosPage,
});

function TodosPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-6 px-4 py-8">
      <OfflineBanner />

      <section className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-md">
        <header className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Todos</h1>
          </div>
          <Link
            to="/todos/new"
            className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground shadow-md hover:shadow-lg"
          >
            New todo
          </Link>
        </header>

        <TodoList />
      </section>
    </main>
  );
}
