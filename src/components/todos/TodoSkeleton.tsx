export function TodoSkeleton() {
  return (
    <li className="flex items-start gap-3 rounded-lg border border-border/60 bg-card/60 p-3 shadow-xs">
      <div className="mt-1 h-5 w-5 rounded-full bg-muted animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-2/3 rounded-full bg-muted animate-pulse" />
        <div className="h-3 w-5/6 rounded-full bg-muted/80 animate-pulse" />
        <div className="h-2 w-1/3 rounded-full bg-muted/70 animate-pulse" />
      </div>
    </li>
  )
}

