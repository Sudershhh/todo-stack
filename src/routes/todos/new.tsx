import { createFileRoute, Link } from '@tanstack/react-router'

import { useTodoMutations } from '@/hooks/useTodoMutations'
import { TodoForm } from '@/components/todos/TodoForm'

export const Route = createFileRoute('/todos/new')({
  component: NewTodoPage,
})

function NewTodoPage() {
  const {
    submit,
    isPending,
    errorMessage,
  } = useTodoMutations().create

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-6 px-4 py-8">
      <header className="flex items-center justify-between gap-3">
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
          className="inline-flex items-center rounded-full border border-border bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-card hover:text-foreground cursor-pointer"
        >
          Back to list
        </Link>
      </header>

      <TodoForm
        onSubmit={submit}
        isPending={isPending}
        error={errorMessage}
      />
    </main>
  )
}

