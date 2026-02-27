import { z } from 'zod'

import { DESCRIPTION_MAX_LENGTH, TITLE_MAX_LENGTH } from '@/config/todos'

export const TodoSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(TITLE_MAX_LENGTH),
  description: z.string().max(DESCRIPTION_MAX_LENGTH).optional().nullable(),
  isCompleted: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type Todo = z.infer<typeof TodoSchema>

export const CreateTodoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(TITLE_MAX_LENGTH),
  description: z.string().max(DESCRIPTION_MAX_LENGTH).optional(),
})

export type CreateTodoInput = z.infer<typeof CreateTodoSchema>

export const PaginatedTodosSchema = z.object({
  items: z.array(TodoSchema),
  nextCursor: z.string().nullable(),
  total: z.number(),
})

export type PaginatedTodos = z.infer<typeof PaginatedTodosSchema>

