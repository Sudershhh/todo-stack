import { useEffect } from 'react'

export function useIntersectionObserver(
  ref: React.RefObject<Element | null>,
  callback: () => void,
) {
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      return
    }

    const target = ref.current
    if (!target) return

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
        rootMargin: '0px 0px 200px 0px',
      },
    )

    observer.observe(target)

    return () => {
      observer.disconnect()
    }
  }, [callback, ref])
}

