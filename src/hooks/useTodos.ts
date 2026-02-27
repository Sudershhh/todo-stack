import { useInfiniteQuery } from "@tanstack/react-query";

import { todosInfiniteQueryOptions } from "@/queries/todoQueries";

export function useTodos() {
  const queryResult = useInfiniteQuery(todosInfiniteQueryOptions);

  const todos = queryResult.data?.pages.flatMap((page) => page.items) ?? [];

  return {
    ...queryResult,
    todos,
  };
}
