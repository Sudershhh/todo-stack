import type { PaginatedTodos, CreateTodoInput, Todo } from '@/types/todo'
import { LIST_PAGE_SIZE } from '@/types/todo'
import {
  fetchTodosServerFn,
  createTodoServerFn,
  toggleTodoServerFn,
} from '@/server/functions/todos'
import { offlineService } from './offline.service'

function isOffline(): boolean {
  if (typeof navigator === 'undefined') return false
  return navigator.onLine === false
}

function createOfflineTempId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `offline-${crypto.randomUUID()}`
  }

  return `offline-${Date.now().toString(36)}`
}

export const todoService = {
  async getTodos(
    cursor?: string,
    limit: number = LIST_PAGE_SIZE,
  ): Promise<PaginatedTodos> {
    try {
      const page = await fetchTodosServerFn({
        data: {
          cursor,
          limit,
        },
      })

      await offlineService.seedCache(page.items)

      return page
    } catch (error) {
      if (isOffline()) {
        const cached = await offlineService.getCachedTodos()
        return {
          items: cached,
          nextCursor: null,
          total: cached.length,
        }
      }

      throw error
    }
  },

  async createTodo(input: CreateTodoInput): Promise<Todo> {
    try {
      const todo = await createTodoServerFn({
        data: input,
      })

      await offlineService.upsertCached(todo)
      return todo
    } catch (error) {
      if (isOffline()) {
        const tempId = createOfflineTempId()

        await offlineService.queueCreate(input, tempId)

        const optimistic: Todo = {
          id: tempId,
          title: input.title,
          description: input.description ?? null,
          isCompleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        await offlineService.upsertCached(optimistic)
        return optimistic
      }

      throw error
    }
  },

  async toggleTodo(id: string): Promise<Todo> {
    try {
      const todo = await toggleTodoServerFn({
        data: { id },
      })

      await offlineService.upsertCached(todo)
      return todo
    } catch (error) {
      if (isOffline()) {
        await offlineService.queueToggle(id)

        const cached = await offlineService.getCachedTodos()
        const existing = cached.find((t) => t.id === id)

        if (existing) {
          const optimistic: Todo = {
            ...existing,
            isCompleted: !existing.isCompleted,
            updatedAt: new Date().toISOString(),
          }

          await offlineService.upsertCached(optimistic)
          return optimistic
        }
      }

      throw error
    }
  },
}

