import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";

import { createTodoMutationOptions } from "@/queries/todoMutations";
import type { CreateTodoInput } from "@/types/todo";

function getMutationErrorMessage(error: unknown): string | null {
  if (!error) return null;
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Something went wrong while creating the todo.";
}

export function useCreateTodo() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const mutation = useMutation(createTodoMutationOptions(queryClient));

  const handleSubmit = async (input: CreateTodoInput) => {
    const result = await mutation.mutateAsync(input);

    if (!mutation.error) {
      router.navigate({ to: "/todos" });
    }

    return result;
  };

  const errorMessage = getMutationErrorMessage(mutation.error);

  return {
    ...mutation,
    submit: handleSubmit,
    errorMessage,
  };
}
