export class ApiError extends Error {
  constructor(message, statusCode, details) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.details = details
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export const fetchWithCred = async (url, options = {}, { retries = 1, timeout = 8000, baseDelay = 300 } = {}) => {
  const attempt = async (n) => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout)
    try {
      const response = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
      })
      clearTimeout(timer)
      return response
    } catch (err) {
      clearTimeout(timer)
      if (err.name === 'AbortError') {
        console.error('Request timed out after', timeout, 'ms')
      }
      if (n < retries && (err.name === 'AbortError' || err.name === 'TypeError')) {
        const delay = baseDelay * 2 ** n + Math.random() * 100
        console.warn(`Retrying in ${Math.round(delay)}ms (attempt ${n + 1})...`)
        await sleep(delay)
        return attempt(n + 1)
      }
      throw err
    }
  }
  return attempt(0)
}

export const fetchWithRefresh = async (url, options = {}, { retries = 1, timeout = 8000 } = {}) => {
  let response = await fetchWithCred(url, options, { retries, timeout })

  if (response.status === 401) {
    console.log('Access token expired, trying refresh...')
    const refreshRes = await fetchWithCred(`${import.meta.env.VITE_API_BASE_URL}/api/refresh`, { method: 'POST' }, { retries, timeout })
    if (refreshRes.ok) {
      console.log('Refresh succeeded, retrying original request...')
      response = await fetchWithCred(url, options, { retries, timeout })
    } else {
      console.log('Refresh failed, user must log in again')
      return refreshRes
    }
  }

  return response
}
