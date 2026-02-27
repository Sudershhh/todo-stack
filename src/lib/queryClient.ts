import { QueryClient } from '@tanstack/react-query'

import {
  MUTATION_RETRY,
  QUERY_GC_TIME_MS,
  QUERY_REFETCH_ON_WINDOW_FOCUS,
  QUERY_STALE_TIME_MS,
} from '@/config/query'

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: QUERY_STALE_TIME_MS,
        gcTime: QUERY_GC_TIME_MS,
        refetchOnWindowFocus: QUERY_REFETCH_ON_WINDOW_FOCUS,
        networkMode: 'offlineFirst',
      },
      mutations: {
        networkMode: 'offlineFirst',
        retry: MUTATION_RETRY,
      },
    },
  })

