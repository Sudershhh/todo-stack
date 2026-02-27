import { infiniteQueryOptions } from '@tanstack/react-query'

import { todoService } from '@/services/todo.service'
import type { PaginatedTodos } from '@/types/todo'
import { todoKeys } from './todoKeys'

function isOfflineError(error: unknown): boolean {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return true
  }

  if (error instanceof TypeError && /fetch/i.test(error.message)) {
    return true
  }

  return false
}

export const todosInfiniteQueryOptions = infiniteQueryOptions({
  queryKey: todoKeys.lists(),
  queryFn: ({ pageParam }) =>
    todoService.getTodos(pageParam as string | undefined),
  initialPageParam: undefined as string | undefined,
  getNextPageParam: (lastPage: PaginatedTodos) => lastPage.nextCursor ?? undefined,
  staleTime: 1000 * 30,
  gcTime: 1000 * 60 * 5,
  refetchOnWindowFocus: false,
  retry(failureCount, error) {
    if (isOfflineError(error)) return false
    return failureCount < 2
  },
})

