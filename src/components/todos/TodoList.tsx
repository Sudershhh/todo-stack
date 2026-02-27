import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

import { useTodos } from "@/hooks/useTodos";
import { useToggleTodo } from "@/hooks/useToggleTodo";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { TodoItem } from "./TodoItem";
import { TodoSkeleton } from "./TodoSkeleton";

export function TodoList() {
  const {
    todos,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useTodos();
  const { toggle } = useToggleTodo();

  const parentRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const rowVirtualizer = useVirtualizer({
    count: todos.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 5,
  });

  useIntersectionObserver(sentinelRef, () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  });

  if (isLoading) {
    return (
      <ul className="space-y-2">
        {Array.from({ length: 4 }).map((_, idx) => (
          <TodoSkeleton key={idx} />
        ))}
      </ul>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        Failed to load todos.{" "}
        {error instanceof Error ? error.message : "Please try again."}
      </div>
    );
  }

  if (!todos.length) {
    return (
      <div className="rounded-lg border border-dashed border-muted bg-card px-4 py-8 text-center text-sm text-muted-foreground">
        No todos yet. Create your first one to get started.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div ref={parentRef} className="max-h-[70vh] overflow-auto pr-1">
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            position: "relative",
          }}
        >
          <ul className="absolute left-0 top-0 w-full space-y-2">
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const todo = todos[virtualRow.index];
              return (
                <div
                  key={todo.id}
                  data-index={virtualRow.index}
                  ref={rowVirtualizer.measureElement}
                  style={{
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <TodoItem todo={todo} onToggle={toggle} />
                </div>
              );
            })}
          </ul>
        </div>
      </div>

      <div ref={sentinelRef} className="h-8">
        {isFetchingNextPage ? (
          <p
            className="flex items-center justify-center text-xs text-muted-foreground"
            aria-label="Loading more todos"
          >
            Loading more…
          </p>
        ) : null}
      </div>
    </div>
  );
}
