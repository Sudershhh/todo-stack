import { create } from 'zustand'

type FlushSuccessResetFn = () => void
const flushSuccessResetters: FlushSuccessResetFn[] = []

interface UiStore {
  isOnline: boolean
  setIsOnline: (v: boolean) => void
  pendingQueueCount: number
  setPendingQueueCount: (n: number) => void
  hasFlushedQueue: boolean
  setHasFlushedQueue: (v: boolean) => void
  queueError: string | null
  setQueueError: (message: string | null) => void
  registerFlushSuccessReset: (fn: FlushSuccessResetFn) => () => void
  runFlushSuccessResetters: () => void
}

export const useUiStore = create<UiStore>((set) => ({
  isOnline: true,
  setIsOnline: (isOnline) => set({ isOnline }),
  pendingQueueCount: 0,
  setPendingQueueCount: (pendingQueueCount) =>
    set({ pendingQueueCount }),
  hasFlushedQueue: false,
  setHasFlushedQueue: (hasFlushedQueue) =>
    set({ hasFlushedQueue }),
  queueError: null,
  setQueueError: (queueError) => set({ queueError }),
  registerFlushSuccessReset(fn) {
    flushSuccessResetters.push(fn)
    return () => {
      const idx = flushSuccessResetters.indexOf(fn)
      if (idx !== -1) flushSuccessResetters.splice(idx, 1)
    }
  },
  runFlushSuccessResetters() {
    flushSuccessResetters.forEach((cb) => cb())
  },
}))

