/**
 * Central API Client for Retail Intelligence
 * Handles base URL configuration, query serialization, JSON parsing,
 * network errors, and standardized FastAPI error formats.
 */

const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
  return url.replace(/\/+$/, '')
}

/**
 * Custom API Error class with HTTP status code and server details
 */
export class ApiError extends Error {
  constructor(message, status = 500, detail = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }
}

/**
 * Parse FastAPI error details into a human-readable string
 */
function extractErrorMessage(data, status) {
  if (!data) {
    return `Server returned HTTP ${status}`
  }

  if (typeof data.detail === 'string') {
    return data.detail
  }

  if (Array.isArray(data.detail)) {
    // Pydantic validation error array
    const msgs = data.detail.map((err) => {
      const field = err.loc ? err.loc.slice(1).join('.') : ''
      return field ? `${field}: ${err.msg}` : err.msg
    })
    return msgs.join(', ')
  }

  if (typeof data.message === 'string') {
    return data.message
  }

  return `Request failed with status ${status}`
}

/**
 * Generic request wrapper
 */
async function request(path, options = {}) {
  const baseUrl = getBaseUrl()
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  let url = `${baseUrl}${cleanPath}`

  if (options.params) {
    const searchParams = new URLSearchParams()
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value))
      }
    })
    const queryString = searchParams.toString()
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString
    }
  }

  const headers = {
    Accept: 'application/json',
    ...(options.headers || {}),
  }

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
    options.body = JSON.stringify(options.body)
  }

  let response
  try {
    response = await fetch(url, {
      ...options,
      headers,
    })
  } catch (netErr) {
    throw new ApiError(
      `Unable to reach backend API at ${baseUrl}. Please ensure the server is running. (${netErr.message})`,
      0,
      netErr
    )
  }

  // Handle empty bodies (e.g. 204 or empty delete responses)
  const contentType = response.headers.get('content-type') || ''
  let responseData = null

  if (contentType.includes('application/json')) {
    try {
      responseData = await response.json()
    } catch {
      responseData = null
    }
  } else {
    try {
      const text = await response.text()
      responseData = text ? { message: text } : null
    } catch {
      responseData = null
    }
  }

  if (!response.ok) {
    const errorMsg = extractErrorMessage(responseData, response.status)
    throw new ApiError(errorMsg, response.status, responseData?.detail || responseData)
  }

  return responseData
}

export const api = {
  get: (path, params = null, options = {}) => request(path, { method: 'GET', params, ...options }),
  post: (path, body = null, options = {}) => request(path, { method: 'POST', body, ...options }),
  put: (path, body = null, options = {}) => request(path, { method: 'PUT', body, ...options }),
  delete: (path, options = {}) => request(path, { method: 'DELETE', ...options }),
}

export default api
