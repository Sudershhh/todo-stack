import { create } from 'zustand'

interface UiStore {
  isOnline: boolean
  setIsOnline: (v: boolean) => void
  pendingQueueCount: number
  setPendingQueueCount: (n: number) => void
  hasFlushedQueue: boolean
  setHasFlushedQueue: (v: boolean) => void
  queueError: string | null
  setQueueError: (message: string | null) => void
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
}))

