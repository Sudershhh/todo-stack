import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

function isOfflineOrIdbError(error: unknown): boolean {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return true
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : ''
  const lower = message.toLowerCase()
  return (
    lower.includes('idbobjectstore') ||
    lower.includes('indexeddb') ||
    lower.includes('quota') ||
    lower.includes('transaction') ||
    lower.includes('failed to fetch') ||
    lower.includes('network error')
  )
}

export function getMutationErrorMessage(
  error: unknown,
  defaultMessage: string,
): string | null {
  if (!error) return null
  if (isOfflineOrIdbError(error)) {
    if (process.env.NODE_ENV === 'development' && error instanceof Error) {
      // eslint-disable-next-line no-console
      console.debug('[offline/IDB error]', error.message)
    }
    return defaultMessage
  }
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return defaultMessage
}
