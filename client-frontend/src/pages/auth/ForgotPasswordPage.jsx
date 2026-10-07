import { useState } from 'react'
import { ArrowLeft, HeartHandshake, KeyRound } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL

export default function ForgotPasswordPage() {
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    email: '',
    otp: '',
    password: '',
    confirmPassword: '',
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  async function handleRequestCode(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    setSubmitting(true)

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to request a password reset.')
      }

      setMessage(data.message)
      setStep(2)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResetPassword(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    setSubmitting(true)

    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),
          otp: form.otp,
          password: form.password,
          confirmPassword: form.confirmPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to reset your password.')
      }

      setMessage(data.message)

      setTimeout(() => {
        navigate('/login', { replace: true })
      }, 1500)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">
          <span className="brand-mark">
            <HeartHandshake size={22} />
          </span>
          ClearGive
        </div>

        <p className="eyebrow">Account recovery</p>

        {step === 1 ? (
          <>
            <h1>Forgot your password?</h1>
            <p className="muted">
              Enter your email address and we'll send you a 6-digit password reset code.
            </p>

            {error && (
              <div className="form-error" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleRequestCode}>
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={updateField}
                required
              />

              <button
                className="primary-button"
                type="submit"
                disabled={submitting}
              >
                <KeyRound size={18} />
                {submitting ? 'Sending code...' : 'Send reset code'}
              </button>
            </form>
          </>
        ) : (
          <>
            <h1>Reset your password</h1>
            <p className="muted">
              Enter the 6-digit code sent to <strong>{form.email}</strong>.
            </p>

            {message && (
              <div className="form-success" role="status">
                {message}
              </div>
            )}

            {error && (
              <div className="form-error" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleResetPassword}>
              <label htmlFor="otp">6-digit reset code</label>
              <input
                id="otp"
                name="otp"
                type="text"
                inputMode="numeric"
                maxLength="6"
                autoComplete="one-time-code"
                value={form.otp}
                onChange={updateField}
                required
              />

              <label htmlFor="password">New password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={updateField}
                minLength="8"
                required
              />

              <label htmlFor="confirmPassword">Confirm new password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={updateField}
                minLength="8"
                required
              />

              <button
                className="primary-button"
                type="submit"
                disabled={submitting}
              >
                <KeyRound size={18} />
                {submitting ? 'Resetting password...' : 'Reset password'}
              </button>
            </form>
          </>
        )}

        <p className="auth-footer">
          <Link to="/login">
            <ArrowLeft size={15} /> Back to login
          </Link>
        </p>
      </section>
    </main>
  )
}
