import { desc, lt, sql } from 'drizzle-orm'

import { db } from '../db/client'
import { todos } from '../db/schema'
import { PAGE_SIZE } from '@/config/todos'
import {
  PaginatedTodosSchema,
  TodoSchema,
  type CreateTodoInput,
  type PaginatedTodos,
  type Todo,
} from '@/types/todo'
import { z } from 'zod'

const CursorSchema = z.object({
  createdAt: z.string().datetime(),
  id: z.string().uuid().optional(),
})

function encodeCursor(createdAt: Date, id: string): string {
  const payload = JSON.stringify({
    createdAt: createdAt.toISOString(),
    id,
  })

  return Buffer.from(payload, 'utf8').toString('base64')
}

function decodeCursor(cursor?: string): { createdAt: Date; id?: string } | null {
  if (!cursor) return null
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf8')
    const parsed = CursorSchema.parse(JSON.parse(decoded))
    const createdAt = new Date(parsed.createdAt)
    if (Number.isNaN(createdAt.getTime())) {
      return null
    }
    return { createdAt, id: parsed.id }
  } catch {
    return null
  }
}

function mapRowToTodo(row: typeof todos.$inferSelect): Todo {
  return TodoSchema.parse({
    id: row.id,
    title: row.title,
    description: row.description ?? null,
    isCompleted: row.isCompleted,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  })
}

export async function getTodos(
  cursor?: string,
  limit: number = PAGE_SIZE,
): Promise<PaginatedTodos> {
  const decoded = decodeCursor(cursor)
  const rows = await db
    .select()
    .from(todos)
    .where(
      decoded
        ? decoded.id
          ? sql`(${todos.createdAt} < ${decoded.createdAt} OR (${todos.createdAt} = ${decoded.createdAt} AND ${todos.id} < ${decoded.id}))`
          : lt(todos.createdAt, decoded.createdAt)
        : undefined,
    )
    .orderBy(desc(todos.createdAt), desc(todos.id))
    .limit(limit + 1)

  const hasMore = rows.length > limit
  const items = hasMore ? rows.slice(0, -1) : rows

  let nextCursor: string | null = null
  if (hasMore) {
    const index = rows.length >= 2 ? rows.length - 2 : rows.length - 1
    const last = rows[index]
    if (last) {
      nextCursor = encodeCursor(last.createdAt, last.id)
    }
  }

  const countResult = await db
    .select({
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(todos)
  const count = countResult[0]?.count ?? 0

  const result: PaginatedTodos = {
    items: items.map(mapRowToTodo),
    nextCursor,
    total: count,
  }
  return PaginatedTodosSchema.parse(result)
}

export async function createTodo(input: CreateTodoInput): Promise<Todo> {
  const [row] = await db
    .insert(todos)
    .values({
      title: input.title,
      description: input.description,
    })
    .returning()

  if (!row) {
    throw new Error('Failed to create todo')
  }

  return mapRowToTodo(row)
}

export async function toggleTodo(id: string): Promise<Todo> {
  const [existing] = await db
    .select()
    .from(todos)
    .where(sql`${todos.id} = ${id}`)
    .limit(1)

  if (!existing) {
    throw new Error('Todo not found')
  }

  const [updated] = await db
    .update(todos)
    .set({
      isCompleted: !existing.isCompleted,
      updatedAt: new Date(),
    })
    .where(sql`${todos.id} = ${id}`)
    .returning()

  if (!updated) {
    throw new Error('Failed to update todo')
  }

  return mapRowToTodo(updated)
}

export async function getTodoById(id: string): Promise<Todo | null> {
  const [row] = await db
    .select()
    .from(todos)
    .where(sql`${todos.id} = ${id}`)
    .limit(1)

  if (!row) return null
  return mapRowToTodo(row)
}

