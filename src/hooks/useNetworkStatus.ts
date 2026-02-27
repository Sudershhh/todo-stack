import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { useUiStore } from '@/store/uiStore'
import { offlineService } from '@/services/offline.service'

export function useNetworkStatus() {
  const queryClient = useQueryClient()
  const {
    isOnline,
    setIsOnline,
    hasFlushedQueue,
    setHasFlushedQueue,
  } = useUiStore()

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    setIsOnline(navigator.onLine)

    const handleOnline = async () => {
      setIsOnline(true)

      if (!hasFlushedQueue) {
        await offlineService.flushQueue(queryClient)
        setHasFlushedQueue(true)
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
      setHasFlushedQueue(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [
    hasFlushedQueue,
    queryClient,
    setHasFlushedQueue,
    setIsOnline,
  ])

  return { isOnline }
}


