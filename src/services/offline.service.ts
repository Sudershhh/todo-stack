import { openDB, type IDBPDatabase } from 'idb'
import type { QueryClient } from '@tanstack/react-query'

import type { CreateTodoInput, Todo } from '@/types/todo'
import {
  createTodoServerFn,
  toggleTodoServerFn,
} from '@/server/functions/todos'

const DB_NAME = 'todo-stack-offline'
const DB_VERSION = 1
const TODOS_STORE = 'todos-cache'
const QUEUE_STORE = 'pending-queue'

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

async function getDb(): Promise<IDBPDatabase> {
  if (typeof indexedDB === 'undefined') {
    throw new Error('IndexedDB is not available in this environment')
  }

  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(TODOS_STORE)) {
        db.createObjectStore(TODOS_STORE, { keyPath: 'id' })
      }

      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        db.createObjectStore(QUEUE_STORE, {
          keyPath: 'id',
          autoIncrement: true,
        })
      }
    },
  })
}

async function seedCacheImpl(todos: Todo[]): Promise<void> {
  const db = await getDb()
  const tx = db.transaction(TODOS_STORE, 'readwrite')
  const store = tx.objectStore(TODOS_STORE)

  await store.clear()
  for (const todo of todos) {
    await store.put(todo)
  }

  await tx.done
}

async function getCachedTodosImpl(): Promise<Todo[]> {
  const db = await getDb()
  const tx = db.transaction(TODOS_STORE, 'readonly')
  const store = tx.objectStore(TODOS_STORE)

  const todos = (await store.getAll()) as Todo[]
  await tx.done

  return todos.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

async function upsertCachedImpl(todo: Todo): Promise<void> {
  const db = await getDb()
  const tx = db.transaction(TODOS_STORE, 'readwrite')
  const store = tx.objectStore(TODOS_STORE)

  await store.put(todo)
  await tx.done
}

async function queueCreateImpl(
  input: CreateTodoInput,
  tempId: string,
): Promise<void> {
  const db = await getDb()
  const tx = db.transaction(QUEUE_STORE, 'readwrite')
  const store = tx.objectStore(QUEUE_STORE)

  const mutation: PendingCreate = {
    type: 'create',
    tempId,
    payload: input,
    timestamp: Date.now(),
  }

  await store.add(mutation)
  await tx.done
}

async function queueToggleImpl(id: string): Promise<void> {
  const db = await getDb()
  const tx = db.transaction(QUEUE_STORE, 'readwrite')
  const store = tx.objectStore(QUEUE_STORE)

  const mutation: PendingToggle = {
    type: 'toggle',
    todoId: id,
    timestamp: Date.now(),
  }

  await store.add(mutation)
  await tx.done
}

async function flushQueueImpl(queryClient: QueryClient): Promise<void> {
  const db = await getDb()
  const tx = db.transaction(QUEUE_STORE, 'readwrite')
  const store = tx.objectStore(QUEUE_STORE)

  const all = (await store.getAll()) as PendingMutation[]
  const sorted = all.sort((a, b) => a.timestamp - b.timestamp)

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
        await store.delete(item.id)
      }
    } catch {
      // Stop processing on first failure to preserve ordering
      break
    }
  }

  await tx.done

  await queryClient.invalidateQueries({
    queryKey: ['todos', 'list'],
  })
}

async function clearQueueImpl(): Promise<void> {
  const db = await getDb()
  const tx = db.transaction(QUEUE_STORE, 'readwrite')
  const store = tx.objectStore(QUEUE_STORE)

  await store.clear()
  await tx.done
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

