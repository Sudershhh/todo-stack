import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getMutationErrorMessage(
  error: unknown,
  defaultMessage: string,
): string | null {
  if (!error) return null
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  return defaultMessage
}
