import { useMutation, useQueryClient } from '@tanstack/react-query'

import { toggleTodoMutationOptions } from '@/queries/todoMutations'

export function useToggleTodo() {
  const queryClient = useQueryClient()

  const mutation = useMutation(
    toggleTodoMutationOptions(queryClient),
  )

  const toggle = (id: string) => {
    return mutation.mutateAsync(id)
  }

  return {
    ...mutation,
    toggle,
  }
}

