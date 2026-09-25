import { useEffect, useState } from 'react'
import { AuthContext } from './auth-context'
import {
  ApiError,
  apiRequest,
  clearStoredToken,
  getStoredToken,
  storeToken,
} from '../services/api'

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getStoredToken())
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function restoreSession() {
      if (!token) {
        if (active) setLoading(false)
        return
      }

      try {
        const data = await apiRequest('/auth/me')
        if (active) setUser(data.user)
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          clearStoredToken()
          if (active) {
            setToken(null)
            setUser(null)
          }
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    restoreSession()
    return () => {
      active = false
    }
  }, [token])

  async function login(credentials) {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: credentials,
    })
    storeToken(data.token)
    setToken(data.token)
    setUser(data.user)
    return data.user
  }

  async function register(details) {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: details,
    })
  }

  function logout() {
    clearStoredToken()
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ token, user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}