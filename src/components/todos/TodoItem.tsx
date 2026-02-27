import { motion } from "motion/react";

import type { Todo } from "@/types/todo";

type TodoItemProps = {
  todo: Todo;
  onToggle: (id: string) => void;
};

export function TodoItem({ todo, onToggle }: TodoItemProps) {
  const isOptimistic = todo.id.startsWith("offline-");

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="group flex items-start gap-3 rounded-lg border border-border bg-card p-3 shadow-sm transition-transform hover:-translate-y-px hover:shadow-lg"
    >
      <button
        type="button"
        onClick={() => onToggle(todo.id)}
        aria-label={`Mark "${todo.title}" as ${
          todo.isCompleted ? "incomplete" : "complete"
        }`}
        className={[
          "mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full border bg-background text-primary transition-colors group-hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer",
          todo.isCompleted ? "border-primary bg-primary/10" : "border-border",
        ].join(" ")}
      >
        <span
          className={[
            "h-3 w-3 rounded-full transition",
            todo.isCompleted ? "bg-primary" : "bg-transparent",
          ].join(" ")}
        />
      </button>

      <div
        className={[
          "flex-1 space-y-1 min-w-0",
          todo.isCompleted ? "opacity-60" : "",
        ].join(" ")}
      >
        <div className="flex items-center gap-2">
          <p
            className={[
              "font-medium wrap-break-word text-pretty",
              todo.isCompleted
                ? "line-through text-muted-foreground"
                : "text-foreground",
            ].join(" ")}
          >
            {todo.title}
          </p>
          {isOptimistic ? (
            <span className="inline-flex items-center rounded-full bg-accent/40 px-2 py-0.5 text-[11px] font-medium text-accent-foreground animate-pulse">
              Syncing…
            </span>
          ) : null}
        </div>

        {todo.description ? (
          <p
            className={[
              "text-sm text-muted-foreground wrap-break-word text-pretty",
              todo.isCompleted ? "line-through" : "",
            ].join(" ")}
          >
            {todo.description}
          </p>
        ) : null}

        <p className="text-[11px] text-muted-foreground/80">
          {new Date(todo.createdAt).toLocaleString()}
        </p>
      </div>
    </motion.div>
  );
}
