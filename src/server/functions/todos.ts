import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import {
  CreateTodoSchema,
  PAGE_SIZE,
  type PaginatedTodos,
  type Todo,
} from '@/types/todo'
import * as todoServerService from '@/server/services/todo.server'

type ServerError = {
  code: string
  message: string
}

function toPublicError(code: string, fallbackMessage: string): ServerError {
  return {
    code,
    message: fallbackMessage,
  }
}

export const fetchTodosServerFn = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      cursor: z.string().optional(),
      limit: z.number().int().positive().max(100).default(PAGE_SIZE),
    }),
  )
  .handler(async ({ data }): Promise<PaginatedTodos> => {
    try {
      return await todoServerService.getTodos(data.cursor, data.limit)
    } catch {
      throw toPublicError('FETCH_TODOS_ERROR', 'Failed to load todos.')
    }
  })

export const createTodoServerFn = createServerFn({ method: 'POST' })
  .inputValidator(CreateTodoSchema)
  .handler(async ({ data }): Promise<Todo> => {
    try {
      return await todoServerService.createTodo(data)
    } catch {
      throw toPublicError('CREATE_TODO_ERROR', 'Failed to create todo.')
    }
  })

export const toggleTodoServerFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      id: z.string().uuid(),
    }),
  )
  .handler(async ({ data }): Promise<Todo> => {
    try {
      return await todoServerService.toggleTodo(data.id)
    } catch {
      throw toPublicError('TOGGLE_TODO_ERROR', 'Failed to toggle todo.')
    }
  })

