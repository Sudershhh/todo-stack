import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { CreateTodoSchema, type CreateTodoInput } from "@/types/todo";

type TodoFormProps = {
  onSubmit: (data: CreateTodoInput) => Promise<unknown> | unknown;
  isPending: boolean;
  error: string | null;
};

export function TodoForm({ onSubmit, isPending, error }: TodoFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateTodoInput>({
    resolver: zodResolver(CreateTodoSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  const submit = handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-md"
    >
      <div className="space-y-1">
        <label htmlFor="title" className="text-sm font-medium text-foreground">
          Title
        </label>
        <input
          id="title"
          type="text"
          autoFocus
          disabled={isPending}
          className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none ring-0 focus:border-ring focus:ring-2 focus:ring-ring"
          placeholder="What do you want to get done?"
          {...register("title")}
        />
        {errors.title ? (
          <p className="text-xs text-destructive" role="alert">
            {errors.title.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-1">
        <label
          htmlFor="description"
          className="text-sm font-medium text-foreground"
        >
          Description
        </label>
        <textarea
          id="description"
          rows={3}
          disabled={isPending}
          className="block w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none ring-0 focus:border-ring focus:ring-2 focus:ring-ring"
          placeholder="Optional context, links, or notes"
          {...register("description")}
        />
        {errors.description ? (
          <p className="text-xs text-destructive" role="alert">
            {errors.description.message}
          </p>
        ) : null}
      </div>

      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex items-center justify-end gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground shadow-md shadow-primary/30 transition hover:shadow-lg disabled:opacity-60"
        >
          {isPending ? "Creating…" : "Create todo"}
        </button>
      </div>
    </form>
  );
}
