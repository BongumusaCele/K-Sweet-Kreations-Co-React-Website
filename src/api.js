export class ApiError extends Error {
  constructor(message, status = 0, fields = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fields = fields
  }
}
export const apiBase = (import.meta.env?.VITE_API_URL || '/api').replace(
  /\/$/,
  '',
)
export function mediaUrl(path) {
  if (!path) return ''
  if (path.startsWith('/api/') || path.startsWith('/uploads/')) {
    const url = new URL(apiBase, window.location.origin)
    return `${url.origin}${path}`
  }
  return path
}
export async function api(
  path,
  { method = 'GET', body, quietUnauthorized = false } = {},
) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 20000)
  try {
    const multipart = body instanceof FormData
    const response = await fetch(`${apiBase}${path}`, {
      method,
      credentials: 'include',
      signal: controller.signal,
      headers: body && !multipart ? { 'Content-Type': 'application/json' } : {},
      body: body ? (multipart ? body : JSON.stringify(body)) : undefined,
    })
    const text = await response.text()
    let data
    try {
      data = text ? JSON.parse(text) : null
    } catch {
      data = null
    }
    if (!response.ok) {
      if (response.status === 401 && !quietUnauthorized)
        window.dispatchEvent(new Event('ksk-session-expired'))
      const errors = data?.errors || {}
      const message =
        Object.values(errors).flat().join(' ') ||
        data?.detail ||
        data?.message ||
        {
          401: 'Please sign in to continue.',
          403: 'You do not have permission to do this.',
          404: 'This record could not be found.',
          409: 'This record has changed. Refresh and try again.',
          413: 'The upload is too large.',
          429: 'Too many requests. Please wait a minute and try again.',
        }[response.status] ||
        'The service could not complete your request. Please try again.'
      throw new ApiError(message, response.status, errors)
    }
    if (response.status !== 204 && data === null)
      throw new ApiError(
        'The service returned an invalid response. Please try again.',
      )
    return data
  } catch (e) {
    if (e instanceof ApiError) throw e
    throw new ApiError(
      e.name === 'AbortError'
        ? 'The request timed out. Please check your connection and try again.'
        : 'Unable to reach the bakery service. Check your connection and try again.',
    )
  } finally {
    clearTimeout(timeout)
  }
}
