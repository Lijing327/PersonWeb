/**
 * SSR-safe fetch against the .NET backend.
 * Server: runtimeConfig.backendApiBase
 * Client: useApi() hostname detection
 * Unwraps `{ code, data }` envelopes used by PersonalSite.Api.
 */
export async function fetchBackendApi<T>(
  path: string,
  options: { query?: Record<string, unknown>; method?: string; body?: unknown; timeout?: number } = {},
): Promise<T> {
  const normalized = path.startsWith('/') ? path : `/${path}`
  const method = (options.method || 'GET').toUpperCase()

  if (import.meta.client) {
    const api = useApi()
    if (method === 'GET') {
      return api.get<T>(normalized, { query: options.query, silent: true })
    }
    if (method === 'POST') {
      return api.post<T>(normalized, options.body, { silent: true })
    }
    throw createError({ statusCode: 500, statusMessage: 'Unsupported client method' })
  }

  const config = useRuntimeConfig()
  const base = String(config.backendApiBase || 'http://localhost:5234/api').replace(/\/$/, '')
  const url = `${base}${normalized}`

  try {
    const response = await $fetch<any>(url, {
      method: method as any,
      query: options.query,
      body: options.body,
      timeout: options.timeout ?? 8000,
    })

    if (response && typeof response === 'object' && 'code' in response) {
      if (response.code !== 0 && response.code !== undefined) {
        throw createError({
          statusCode: response.code === 404 ? 404 : 502,
          statusMessage: response.message || 'Backend error',
        })
      }
      return (response.data !== undefined ? response.data : response) as T
    }

    return response as T
  } catch (error: unknown) {
    const status = typeof error === 'object' && error !== null
      ? Number(
        (error as { statusCode?: number; status?: number }).statusCode
        ?? (error as { statusCode?: number; status?: number }).status
        ?? 0,
      )
      : 0

    if (status === 404) {
      throw createError({ statusCode: 404, statusMessage: 'Not Found' })
    }

    if (status >= 400 && status < 600) {
      throw createError({
        statusCode: status === 404 ? 404 : 502,
        statusMessage: status === 404 ? 'Not Found' : 'Upstream error',
      })
    }

    throw createError({
      statusCode: 502,
      statusMessage: 'Upstream error',
    })
  }
}

export function isNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const status = Number(
    (error as { statusCode?: number; status?: number }).statusCode
    ?? (error as { statusCode?: number; status?: number }).status
    ?? 0,
  )
  return status === 404
}
