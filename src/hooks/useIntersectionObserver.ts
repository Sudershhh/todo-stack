import { useEffect } from 'react'

export function useIntersectionObserver(
  ref: React.RefObject<Element | null>,
  callback: () => void,
  options?: {
    root?: React.RefObject<Element | null>
    enabled?: boolean
  },
) {
  const rootRef = options?.root
  const enabled = options?.enabled !== false
  useEffect(() => {
    if (!enabled || typeof IntersectionObserver === 'undefined') {
      return
    }

    const target = ref.current
    const root = rootRef?.current ?? null
    if (!target) return
    if (rootRef != null && !root) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            callback()
            break
          }
        }
      },
      {
        root: root ?? undefined,
        rootMargin: '0px 0px 200px 0px',
      },
    )

    observer.observe(target)

    return () => {
      observer.disconnect()
    }
  }, [callback, ref, rootRef, enabled])
}

