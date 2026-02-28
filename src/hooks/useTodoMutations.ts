import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";

import { getMutationErrorMessage } from "@/lib/utils";
import {
  createTodoMutationOptions,
  toggleTodoMutationOptions,
} from "@/queries/todoMutations";
import type { CreateTodoInput } from "@/types/todo";

export function useTodoMutations() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const createMutation = useMutation(createTodoMutationOptions(queryClient));
  const toggleMutation = useMutation(toggleTodoMutationOptions(queryClient));

  const createSubmit = async (input: CreateTodoInput) => {
    const result = await createMutation.mutateAsync(input);

    if (!createMutation.error) {
      router.navigate({ to: "/todos" });
    }

    return result;
  };

  return {
    create: {
      ...createMutation,
      submit: createSubmit,
      errorMessage: getMutationErrorMessage(
        createMutation.error,
        "Something went wrong while creating the todo.",
      ),
    },
    toggle: {
      ...toggleMutation,
      toggle: (id: string) => toggleMutation.mutateAsync(id),
      errorMessage: getMutationErrorMessage(
        toggleMutation.error,
        "Something went wrong while updating the todo.",
      ),
    },
  };
}
