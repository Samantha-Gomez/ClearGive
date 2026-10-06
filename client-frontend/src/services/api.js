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

const notifyAdminAuthorizationFailure = (path, status) => {
  const isAdminEndpoint = String(path)
    .split(/[?#]/, 1)[0]
    .split('/')
    .includes('admin')

  if (isAdminEndpoint && (status === 401 || status === 403)) {
    window.dispatchEvent(new Event('cleargive:admin-access-denied'))
  }
}

export async function apiRequest(path, options = {}) {
  const { body, headers = {}, ...requestOptions } = options
  const token = getStoredToken()
  const requestHeaders = { ...headers }
  const isFormData =
    typeof FormData !== 'undefined' && body instanceof FormData

  if (body !== undefined && !isFormData) {
    requestHeaders['Content-Type'] = 'application/json'
  }
  if (token) requestHeaders.Authorization = `Bearer ${token}`

  let response
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...requestOptions,
      headers: requestHeaders,
      body:
        body === undefined
          ? undefined
          : isFormData
            ? body
            : JSON.stringify(body),
    })
  } catch {
    throw new ApiError('Unable to connect to the ClearGive server.', 0)
  }

  const contentType = response.headers.get('content-type') || ''
  const data = contentType.includes('application/json')
    ? await response.json()
    : await response.text()

  if (!response.ok) {
    notifyAdminAuthorizationFailure(path, response.status)
    const message = typeof data === 'object' && data?.message
      ? data.message
      : 'The request could not be completed.'
    throw new ApiError(message, response.status, data)
  }

  return data
}

export async function apiBlobRequest(path) {
  const token = getStoredToken()
  const headers = token
    ? { Authorization: `Bearer ${token}` }
    : {}

  let response
  try {
    response = await fetch(`${API_URL}${path}`, { headers })
  } catch {
    throw new ApiError('Unable to connect to the ClearGive server.', 0)
  }

  if (!response.ok) {
    notifyAdminAuthorizationFailure(path, response.status)
    const contentType = response.headers.get('content-type') || ''
    const data = contentType.includes('application/json')
      ? await response.json()
      : await response.text()
    const message = typeof data === 'object' && data?.message
      ? data.message
      : 'The document could not be downloaded.'
    throw new ApiError(message, response.status, data)
  }

  return response.blob()
}

export async function apiDownloadRequest(path) {
  const token = getStoredToken()
  const headers = { Accept: 'text/csv' }
  if (token) headers.Authorization = `Bearer ${token}`

  let response
  try {
    response = await fetch(`${API_URL}${path}`, { headers })
  } catch {
    throw new ApiError('Unable to connect to the ClearGive server.', 0)
  }

  const contentType = response.headers.get('content-type') || ''
  if (!response.ok || contentType.includes('json')) {
    notifyAdminAuthorizationFailure(path, response.status)
    const data = contentType.includes('json')
      ? await response.json()
      : await response.text()
    const message = typeof data === 'object' && data?.message
      ? data.message
      : 'The report could not be exported.'
    throw new ApiError(message, response.status, data)
  }

  const contentDisposition = response.headers.get('content-disposition') || ''
  const encodedFilename = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1]
  const plainFilename = contentDisposition.match(/filename="?([^";]+)"?/i)?.[1]
  let filename = plainFilename || ''

  if (encodedFilename) {
    try {
      filename = decodeURIComponent(encodedFilename)
    } catch {
      filename = plainFilename || ''
    }
  }

  filename = filename.split(/[\\/]/).pop().replace(/[\r\n"]/g, '')

  return {
    blob: await response.blob(),
    filename,
  }
}

export { TOKEN_KEY }