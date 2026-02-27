import { useMutation, useQueryClient } from '@tanstack/react-query'

import { toggleTodoMutationOptions } from '@/queries/todoMutations'

function getMutationErrorMessage(error: unknown): string | null {
  if (!error) return null
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Something went wrong while updating the todo.'
}

export function useToggleTodo() {
  const queryClient = useQueryClient()

  const mutation = useMutation(
    toggleTodoMutationOptions(queryClient),
  )

  const toggle = (id: string) => {
    return mutation.mutateAsync(id)
  }

  const errorMessage = getMutationErrorMessage(mutation.error)

  return {
    ...mutation,
    toggle,
    errorMessage,
  }
}

