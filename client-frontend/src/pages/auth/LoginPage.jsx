import { useState } from 'react'
import { HeartHandshake, LogIn } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { getDashboardPath } from '../../routes/routeUtils'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [verificationEmail, setVerificationEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setVerificationEmail('')
    setSubmitting(true)
    try {
      const user = await login(form)
      navigate(location.state?.from?.pathname || getDashboardPath(user.role), { replace: true })
    } catch (requestError) {
      setError(requestError.message)
      if (requestError.details?.code === 'EMAIL_VERIFICATION_REQUIRED') {
        setVerificationEmail(form.email.trim().toLowerCase())
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand"><span className="brand-mark"><HeartHandshake size={22} /></span> ClearGive</div>
        <p className="eyebrow">Welcome back</p>
        <h1>Make every contribution count.</h1>
        <p className="muted">Sign in to continue supporting communities with clarity.</p>
        {error && <div className="form-error" role="alert">{error}</div>}
        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email address</label>
          <input id="email" name="email" type="email" autoComplete="email" value={form.email} onChange={updateField} required />
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" autoComplete="current-password" value={form.password} onChange={updateField} minLength="8" required />
          <p className="auth-footer">
          <Link to="/forgot-password">Forgot password?</Link>
          </p>
          <button className="primary-button" type="submit" disabled={submitting}>
            <LogIn size={18} />
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        {verificationEmail && (
          <p className="auth-footer">
            <Link to="/verify-email" state={{ email: verificationEmail }}>
              Continue to email verification
            </Link>
          </p>
        )}
        <p className="auth-footer">New to ClearGive? <Link to="/register">Create an account</Link></p>
      </section>
    </main>
  )
}