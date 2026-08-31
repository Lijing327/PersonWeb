import type { H3Error } from 'h3'
import { createError } from 'h3'

function isH3Error(error: unknown): error is H3Error {
  return (
    typeof error === 'object'
    && error !== null
    && 'statusCode' in error
    && typeof (error as H3Error).statusCode === 'number'
  )
}

/**
 * Log internally; return a safe client-facing error without leaking paths or stacks.
 */
export function throwSafeApiError(error: unknown, fallbackMessage: string): never {
  if (isH3Error(error)) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || fallbackMessage,
    })
  }

  console.error(fallbackMessage, error)
  throw createError({
    statusCode: 500,
    statusMessage: fallbackMessage,
  })
}
