import { openDB, type IDBPDatabase } from 'idb'
import type { QueryClient } from '@tanstack/react-query'

import {
  OFFLINE_DB_NAME,
  OFFLINE_DB_VERSION,
  OFFLINE_QUEUE_STORE,
  OFFLINE_TODOS_STORE,
} from '@/config/offline'
import { useUiStore } from '@/store/uiStore'
import {
  createTodoServerFn,
  toggleTodoServerFn,
} from '@/server/functions/todos'
import type { CreateTodoInput, Todo } from '@/types/todo'
import { TodoSchema } from '@/types/todo'

type PendingCreate = {
  id?: number
  type: 'create'
  tempId: string
  payload: CreateTodoInput
  timestamp: number
}

type PendingToggle = {
  id?: number
  type: 'toggle'
  todoId: string
  timestamp: number
}

type PendingMutation = PendingCreate | PendingToggle

type FlushQueueResult = {
  processed: number
  remaining: number
  error?: unknown
}

function setPendingQueueCount(count: number) {
  useUiStore.getState().setPendingQueueCount(count)
}

function setQueueError(message: string | null) {
  useUiStore.getState().setQueueError(message)
}

async function getDb(): Promise<IDBPDatabase> {
  if (typeof indexedDB === 'undefined') {
    throw new Error('IndexedDB is not available in this environment')
  }

  return openDB(OFFLINE_DB_NAME, OFFLINE_DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(OFFLINE_TODOS_STORE)) {
        db.createObjectStore(OFFLINE_TODOS_STORE, { keyPath: 'id' })
      }

      if (!db.objectStoreNames.contains(OFFLINE_QUEUE_STORE)) {
        db.createObjectStore(OFFLINE_QUEUE_STORE, {
          keyPath: 'id',
          autoIncrement: true,
        })
      }
    },
  })
}

async function seedCacheImpl(todos: Todo[]): Promise<void> {
  const db = await getDb()
  const tx = db.transaction(OFFLINE_TODOS_STORE, 'readwrite')
  const store = tx.objectStore(OFFLINE_TODOS_STORE)

  await store.clear()
  for (const todo of todos) {
    await store.put(todo)
  }

  await tx.done
}

async function getCachedTodosImpl(): Promise<Todo[]> {
  const db = await getDb()
  const tx = db.transaction(OFFLINE_TODOS_STORE, 'readonly')
  const store = tx.objectStore(OFFLINE_TODOS_STORE)

  const rawTodos = await store.getAll()
  await tx.done

  const todos: Todo[] = []

  for (const item of rawTodos) {
    const parsed = TodoSchema.safeParse(item)
    if (parsed.success) {
      todos.push(parsed.data)
    }
  }

  return todos.sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime()
    const bTime = new Date(b.createdAt).getTime()
    return bTime - aTime
  })
}

async function upsertCachedImpl(todo: Todo): Promise<void> {
  const db = await getDb()
  const tx = db.transaction(OFFLINE_TODOS_STORE, 'readwrite')
  const store = tx.objectStore(OFFLINE_TODOS_STORE)

  await store.put(todo)
  await tx.done
}

async function queueCreateImpl(
  input: CreateTodoInput,
  tempId: string,
): Promise<void> {
  const db = await getDb()
  const tx = db.transaction(OFFLINE_QUEUE_STORE, 'readwrite')
  const store = tx.objectStore(OFFLINE_QUEUE_STORE)

  const mutation: PendingCreate = {
    type: 'create',
    tempId,
    payload: input,
    timestamp: Date.now(),
  }

  await store.add(mutation)
  const count = await store.count()
  await tx.done

  setPendingQueueCount(count)
}

async function queueToggleImpl(id: string): Promise<void> {
  const db = await getDb()
  const tx = db.transaction(OFFLINE_QUEUE_STORE, 'readwrite')
  const store = tx.objectStore(OFFLINE_QUEUE_STORE)

  const mutation: PendingToggle = {
    type: 'toggle',
    todoId: id,
    timestamp: Date.now(),
  }

  await store.add(mutation)
  const count = await store.count()
  await tx.done

  setPendingQueueCount(count)
}

async function deleteQueuedItemById(id: number): Promise<void> {
  const db = await getDb()
  const tx = db.transaction(OFFLINE_QUEUE_STORE, 'readwrite')
  const store = tx.objectStore(OFFLINE_QUEUE_STORE)
  await store.delete(id)
  await tx.done
}

async function flushQueueImpl(queryClient: QueryClient): Promise<FlushQueueResult> {
  const db = await getDb()
  const tx = db.transaction(OFFLINE_QUEUE_STORE, 'readonly')
  const store = tx.objectStore(OFFLINE_QUEUE_STORE)
  const all = (await store.getAll()) as PendingMutation[]
  await tx.done

  const sorted = all.sort((a, b) => a.timestamp - b.timestamp)

  let processed = 0
  let error: unknown

  for (const item of sorted) {
    try {
      if (item.type === 'create') {
        const created = await createTodoServerFn({ data: item.payload })
        await upsertCachedImpl(created)
      } else {
        const updated = await toggleTodoServerFn({
          data: { id: item.todoId },
        })
        await upsertCachedImpl(updated)
      }

      if (typeof item.id === 'number') {
        await deleteQueuedItemById(item.id)
      }
      processed += 1
    } catch (err) {
      // Stop processing on first failure to preserve ordering
      // and surface the error for observability.
      // eslint-disable-next-line no-console
      console.error('Failed to flush offline mutation from queue', err, item)
      error = err
      break
    }
  }

  const remaining = sorted.length - processed
  setPendingQueueCount(remaining)
  setQueueError(error ? 'We could not sync some changes. We will keep retrying when you are online.' : null)

  await queryClient.invalidateQueries({
    queryKey: ['todos', 'list'],
  })

  return {
    processed,
    remaining,
    error,
  }
}

async function clearQueueImpl(): Promise<void> {
  const db = await getDb()
  const tx = db.transaction(OFFLINE_QUEUE_STORE, 'readwrite')
  const store = tx.objectStore(OFFLINE_QUEUE_STORE)

  await store.clear()
  await tx.done

  setPendingQueueCount(0)
  setQueueError(null)
}

export const offlineService = {
  seedCache: seedCacheImpl,
  getCachedTodos: getCachedTodosImpl,
  upsertCached: upsertCachedImpl,
  queueCreate: queueCreateImpl,
  queueToggle: queueToggleImpl,
  flushQueue: flushQueueImpl,
  clearQueue: clearQueueImpl,
}

