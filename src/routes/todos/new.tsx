import { createFileRoute, Link } from '@tanstack/react-router'

import { useCreateTodo } from '@/hooks/useCreateTodo'
import { TodoForm } from '@/components/todos/TodoForm'

export const Route = createFileRoute('/todos/new')({
  component: NewTodoPage,
})

function NewTodoPage() {
  const {
    submit,
    isPending,
    error,
  } = useCreateTodo()

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-4 px-4 py-6">
      <header className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            New todo
          </h1>
          <p className="text-xs text-muted-foreground">
            Capture a task with an optional description.
          </p>
        </div>
        <Link
          to="/todos"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Back to list
        </Link>
      </header>

      <TodoForm
        onSubmit={submit}
        isPending={isPending}
        error={error instanceof Error ? error.message : null}
      />
    </main>
  )
}

