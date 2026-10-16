import { useEffect, useState } from 'react'
import { AuthContext } from './auth-context'
import {
  ApiError,
  apiRequest,
} from '../services/api'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const handleAdminAuthorizationFailure = () => {
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
          if (active) {
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
  }, [])

  async function login(credentials) {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: credentials,
    })

    if (data.user?.role === 'admin') {
      await apiRequest('/admin/stats')
    }

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

  async function logout() {
    await apiRequest('/auth/logout', { method: 'POST' }).catch(() => {})
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
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
