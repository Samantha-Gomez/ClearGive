const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const TOKEN_KEY = 'cleargive_token'

export class ApiError extends Error {
  constructor(message, status, details = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

export const getStoredToken = () => window.localStorage.getItem(TOKEN_KEY)

export const storeToken = (token) => window.localStorage.setItem(TOKEN_KEY, token)

export const clearStoredToken = () => window.localStorage.removeItem(TOKEN_KEY)

export async function apiRequest(path, options = {}) {
  const { body, headers = {}, ...requestOptions } = options
  const token = getStoredToken()
  const requestHeaders = { ...headers }

  if (body !== undefined) requestHeaders['Content-Type'] = 'application/json'
  if (token) requestHeaders.Authorization = `Bearer ${token}`

  let response
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...requestOptions,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError('Unable to connect to the ClearGive server.', 0)
  }

  const contentType = response.headers.get('content-type') || ''
  const data = contentType.includes('application/json')
    ? await response.json()
    : await response.text()

  if (!response.ok) {
    const message = typeof data === 'object' && data?.message
      ? data.message
      : 'The request could not be completed.'
    throw new ApiError(message, response.status, data)
  }

  return data
}

export { TOKEN_KEY }