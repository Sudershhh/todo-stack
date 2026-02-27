import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";

import { createTodoMutationOptions } from "@/queries/todoMutations";
import type { CreateTodoInput } from "@/types/todo";

export function useCreateTodo() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const mutation = useMutation(createTodoMutationOptions(queryClient));

  const handleSubmit = async (input: CreateTodoInput) => {
    const result = await mutation.mutateAsync(input);

    if (!mutation.error) {
      router.navigate({ to: "/todos" });
      return result;
    }

    return result;
  };

  return {
    ...mutation,
    submit: handleSubmit,
  };
}
