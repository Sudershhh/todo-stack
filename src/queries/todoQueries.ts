import { infiniteQueryOptions } from '@tanstack/react-query'

import { LIST_PAGE_SIZE } from '@/config/todos'
import {
  QUERY_GC_TIME_MS,
  QUERY_REFETCH_ON_WINDOW_FOCUS,
  QUERY_RETRY_COUNT,
  QUERY_STALE_TIME_MS,
} from '@/config/query'
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
    todoService.getTodos(pageParam as string | undefined, LIST_PAGE_SIZE),
  initialPageParam: undefined as string | undefined,
  getNextPageParam: (lastPage: PaginatedTodos) => lastPage.nextCursor ?? undefined,
  staleTime: QUERY_STALE_TIME_MS,
  gcTime: QUERY_GC_TIME_MS,
  refetchOnWindowFocus: QUERY_REFETCH_ON_WINDOW_FOCUS,
  retry(failureCount, error) {
    if (isOfflineError(error)) return false
    return failureCount < QUERY_RETRY_COUNT
  },
})

