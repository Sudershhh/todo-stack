import { motion } from "motion/react";

import { useUiStore } from "@/store/uiStore";

export function OfflineBanner() {
  const { isOnline, pendingQueueCount } = useUiStore();

  if (isOnline && pendingQueueCount === 0) {
    return null;
  }

  const message = isOnline
    ? "Reconnected. Syncing your changes…"
    : pendingQueueCount > 0
      ? `You’re offline. ${pendingQueueCount} change${
          pendingQueueCount === 1 ? "" : "s"
        } will sync when you reconnect.`
      : "You’re offline. Changes will sync when you reconnect.";

  return (
    <motion.div
      initial={{ y: 96, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center"
      role="status"
      aria-live="polite"
    >
      <div className="pointer-events-auto flex max-w-lg items-center gap-3 rounded-full border border-sidebar-border bg-sidebar px-4 py-2 text-sm text-sidebar-foreground shadow-lg">
        <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
        <p>{message}</p>
      </div>
    </motion.div>
  );
}
