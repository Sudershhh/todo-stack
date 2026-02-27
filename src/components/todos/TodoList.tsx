import { useRef, useCallback, useState, useLayoutEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

import { useTodos } from "@/hooks/useTodos";
import { useToggleTodo } from "@/hooks/useToggleTodo";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { TodoItem } from "./TodoItem";
import { TodoSkeleton } from "./TodoSkeleton";

const ROW_HEIGHT = 112;

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
  const [scrollReady, setScrollReady] = useState(false);

  useLayoutEffect(() => {
    if (parentRef.current && sentinelRef.current) setScrollReady(true);
  });

  const fetchStateRef = useRef({
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  });
  fetchStateRef.current = {
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };

  const onSentinelVisible = useCallback(() => {
    const s = fetchStateRef.current;
    if (s.hasNextPage && !s.isFetchingNextPage) {
      s.fetchNextPage();
    }
  }, []);

  const rowVirtualizer = useVirtualizer({
    count: todos.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 5,
  });

  useIntersectionObserver(sentinelRef, onSentinelVisible, {
    root: parentRef,
    enabled: scrollReady,
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
          <ul className="absolute left-0 top-0 w-full list-none p-0 m-0">
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const todo = todos[virtualRow.index];
              return (
                <li
                  key={todo.id}
                  data-index={virtualRow.index}
                  className="overflow-hidden pb-2"
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: "100%",
                    height: ROW_HEIGHT,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <TodoItem todo={todo} onToggle={toggle} />
                </li>
              );
            })}
          </ul>
        </div>
        <div
          ref={sentinelRef}
          className="h-8 min-h-8 flex items-center justify-center"
        >
          {isFetchingNextPage ? (
            <p
              className="text-xs text-muted-foreground"
              aria-label="Loading more todos"
            >
              Loading more…
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
