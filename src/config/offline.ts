/** IndexedDB database name for offline todo cache and queue */
export const OFFLINE_DB_NAME = 'todo-stack-offline'

/** IndexedDB schema version */
export const OFFLINE_DB_VERSION = 1

/** Object store key for cached todos */
export const OFFLINE_TODOS_STORE = 'todos-cache'

/** Object store key for pending mutation queue */
export const OFFLINE_QUEUE_STORE = 'pending-queue'
