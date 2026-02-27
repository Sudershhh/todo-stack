import type { InfiniteData, QueryClient } from '@tanstack/react-query'

import type { PaginatedTodos, Todo } from '@/types/todo'
import { todoKeys } from './todoKeys'
import { todoService } from '@/services/todo.service'

type TodosInfiniteData = InfiniteData<PaginatedTodos, string | undefined>

function updateTodosInCache(
  queryClient: QueryClient,
  updater: (current: TodosInfiniteData | undefined) => TodosInfiniteData,
) {
  queryClient.setQueryData<TodosInfiniteData | undefined>(
    todoKeys.lists(),
    (current) => updater(current),
  )
}

export function createTodoMutationOptions(queryClient: QueryClient) {
  return {
    mutationFn: (input: Parameters<typeof todoService.createTodo>[0]) =>
      todoService.createTodo(input),
    onMutate: async (
      input: Parameters<typeof todoService.createTodo>[0],
    ) => {
      await queryClient.cancelQueries({ queryKey: todoKeys.lists() })

      const previous =
        queryClient.getQueryData<TodosInfiniteData>(todoKeys.lists())

      const tempId = `offline-${Date.now().toString(36)}`
      const optimistic: Todo = {
        id: tempId,
        title: input.title,
        description: input.description ?? null,
        isCompleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      updateTodosInCache(queryClient, (current) => {
        if (!current) {
          return {
            pageParams: [undefined],
            pages: [
              {
                items: [optimistic],
                nextCursor: null,
                total: 1,
              },
            ],
          }
        }

        const [first, ...rest] = current.pages
        const updatedFirst: PaginatedTodos = {
          ...first,
          items: [optimistic, ...first.items],
          total: first.total + 1,
        }

        return {
          ...current,
          pages: [updatedFirst, ...rest],
        }
      })

      return { previous }
    },
    onError: (
      _error: unknown,
      _variables: Parameters<typeof todoService.createTodo>[0],
      context: { previous?: TodosInfiniteData } | undefined,
    ) => {
      if (context?.previous) {
        queryClient.setQueryData(todoKeys.lists(), context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.lists() })
    },
  }
}

export function toggleTodoMutationOptions(queryClient: QueryClient) {
  return {
    mutationFn: (id: string) => todoService.toggleTodo(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: todoKeys.lists() })

      const previous =
        queryClient.getQueryData<TodosInfiniteData>(todoKeys.lists())

      updateTodosInCache(queryClient, (current) => {
        if (!current) {
          return { pageParams: [undefined], pages: [] }
        }

        const pages = current.pages.map((page) => ({
          ...page,
          items: page.items.map((todo) =>
            todo.id === id
              ? {
                  ...todo,
                  isCompleted: !todo.isCompleted,
                  updatedAt: new Date().toISOString(),
                }
              : todo,
          ),
        }))

        return {
          ...current,
          pages,
        }
      })

      return { previous }
    },
    onError: (_error: unknown, _variables: string, context?: { previous?: TodosInfiniteData }) => {
      if (context?.previous) {
        queryClient.setQueryData(todoKeys.lists(), context.previous)
      }
    },
    onSettled: (_data: Todo | undefined, _error: unknown, id: string) => {
      queryClient.invalidateQueries({
        queryKey: todoKeys.detail(id),
      })
    },
  }
}

