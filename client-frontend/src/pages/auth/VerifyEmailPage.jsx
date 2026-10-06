import { useState } from 'react'
import { ArrowLeft, CheckCircle2, HeartHandshake, MailCheck, RefreshCw } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'

export default function VerifyEmailPage() {
  const { verifyEmail, resendEmailVerification } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState(location.state?.email || '')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [verified, setVerified] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [resending, setResending] = useState(false)

  async function handleVerify(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    setVerifying(true)

    try {
      await verifyEmail({ email, otp })
      setOtp('')
      setVerified(true)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setVerifying(false)
    }
  }

  async function handleResend() {
    setError('')
    setNotice('')
    setResending(true)

    try {
      const result = await resendEmailVerification(email)
      setNotice(result.message)
      setOtp('')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setResending(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link className="back-link" to="/login">
          <ArrowLeft size={16} /> Back to sign in
        </Link>
        <div className="auth-brand">
          <span className="brand-mark"><HeartHandshake size={22} /></span>
          ClearGive
        </div>
        {verified ? (
          <>
            <p className="eyebrow">Email verified</p>
            <h1><CheckCircle2 size={22} /> You're all set.</h1>
            <p className="muted" role="status">
              Your email address has been verified. You can now sign in.
            </p>
            <Link className="primary-button" to="/login" replace>
              <MailCheck size={18} /> Continue to login
            </Link>
          </>
        ) : (
          <>
            <p className="eyebrow">One more step</p>
            <h1>Verify your email.</h1>
            <p className="muted">
              Enter the 6-digit code sent to the email address below. The code expires after 10 minutes.
            </p>
            {error && <div className="form-error" role="alert">{error}</div>}
            {notice && <p className="muted" role="status">{notice}</p>}
            <form onSubmit={handleVerify}>
              <label htmlFor="verification-email">Email address</label>
              <input
                id="verification-email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
              <label htmlFor="verification-otp">6-digit verification code</label>
              <input
                id="verification-otp"
                name="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                required
              />
              <button className="primary-button" type="submit" disabled={verifying || otp.length !== 6}>
                <CheckCircle2 size={18} />
                {verifying ? 'Verifying...' : 'Verify email'}
              </button>
            </form>
            <button
              className="secondary-button"
              type="button"
              onClick={handleResend}
              disabled={resending || !email.trim()}
            >
              <RefreshCw size={16} />
              {resending ? 'Sending...' : 'Resend code'}
            </button>
            <p className="auth-footer">
              Already verified? <Link to="/login">Continue to login</Link>
            </p>
          </>
        )}
      </section>
    </main>
  )
}