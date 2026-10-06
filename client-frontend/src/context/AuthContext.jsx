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
    const handleAdminAuthorizationFailure = () => {
      clearStoredToken()
      setToken(null)
      setUser(null)
    }

    window.addEventListener(
      'cleargive:admin-access-denied',
      handleAdminAuthorizationFailure,
    )

    return () => {
      window.removeEventListener(
        'cleargive:admin-access-denied',
        handleAdminAuthorizationFailure,
      )
    }
  }, [])

  useEffect(() => {
    let active = true

    async function restoreSession() {
      if (!token) {
        if (active) setLoading(false)
        return
      }

      let checkingAdminAuthorization = false

      try {
        const data = await apiRequest('/auth/me')

        if (data.user?.role === 'admin') {
          checkingAdminAuthorization = true
          await apiRequest('/admin/stats')
        }

        if (active) setUser(data.user)
      } catch (error) {
        const isExpiredSession =
          error instanceof ApiError && error.status === 401
        const isRejectedAdminSession =
          checkingAdminAuthorization &&
          error instanceof ApiError &&
          error.status === 403

        if (isExpiredSession || isRejectedAdminSession) {
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

    if (data.user?.role === 'admin') {
      storeToken(data.token)
      try {
        await apiRequest('/admin/stats')
      } catch (error) {
        clearStoredToken()
        throw error
      }
    }

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

  async function verifyEmail(details) {
    return apiRequest('/auth/verify-email', {
      method: 'POST',
      body: details,
    })
  }

  async function resendEmailVerification(email) {
    return apiRequest('/auth/resend-email-verification', {
      method: 'POST',
      body: { email },
    })
  }

  function logout() {
    clearStoredToken()
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        login,
        register,
        verifyEmail,
        resendEmailVerification,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}