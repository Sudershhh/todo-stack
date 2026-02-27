import { z } from 'zod'

export const TodoSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(280),
  description: z.string().max(1000).optional().nullable(),
  isCompleted: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type Todo = z.infer<typeof TodoSchema>

export const CreateTodoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(280),
  description: z.string().max(1000).optional(),
})

export type CreateTodoInput = z.infer<typeof CreateTodoSchema>

export const PaginatedTodosSchema = z.object({
  items: z.array(TodoSchema),
  nextCursor: z.string().nullable(),
  total: z.number(),
})

export type PaginatedTodos = z.infer<typeof PaginatedTodosSchema>

export const PAGE_SIZE = 25

