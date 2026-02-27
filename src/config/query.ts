/** Default query stale time in ms (30s) */
export const QUERY_STALE_TIME_MS = 1000 * 30

/** Default query garbage collection time in ms (5min) */
export const QUERY_GC_TIME_MS = 1000 * 60 * 5

/** Default refetch on window focus */
export const QUERY_REFETCH_ON_WINDOW_FOCUS = false

/** Max retry count for queries (e.g. todo list) */
export const QUERY_RETRY_COUNT = 2

/** Mutation retry count (0 = no retry) */
export const MUTATION_RETRY = 0
