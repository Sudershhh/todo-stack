import { Link, createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/todos' })
  },
  component: LandingPage,
})

function LandingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-semibold text-foreground">
          Todo Stack
        </h1>
        <p className="text-sm text-muted-foreground">
          Redirecting you to your todos…
        </p>
        <Link
          to="/todos"
          className="inline-flex items-center rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground shadow-md hover:shadow-lg"
        >
          Go to todos
        </Link>
      </div>
    </main>
  )
}

