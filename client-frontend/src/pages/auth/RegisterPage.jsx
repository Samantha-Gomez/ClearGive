import { useState } from 'react'
import { ArrowLeft, HeartHandshake, UserPlus } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'

const initialForm = {
  fullName: '', email: '', contactNumber: '', password: '', confirmPassword: '', role: 'donor', organizationName: '', organizationType: 'NGO/non-profit',
}

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) {
      setError('Password and confirm password do not match.')
      return
    }
    setSubmitting(true)
    try {
      await register(form)
      navigate('/login', { replace: true, state: { registered: true } })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
    <section className="auth-card register-card">
    <Link className="back-link" to="/login">
      <ArrowLeft size={16} /> Back to sign in
    </Link>

    <div className="auth-brand">
      <span className="brand-mark">
        <HeartHandshake size={22} />
      </span>
      ClearGive
    </div>
    
        <p className="eyebrow">Join the network</p>
        <h1>Create your account.</h1>
        <p className="muted">Choose how you will take part in community support.</p>
        {error && <div className="form-error" role="alert">{error}</div>}
        <form onSubmit={handleSubmit}>
          <label htmlFor="fullName">Full name</label>
          <input id="fullName" name="fullName" value={form.fullName} onChange={updateField} minLength="2" required />
          <label htmlFor="email">Email address</label>
          <input id="email" name="email" type="email" autoComplete="email" value={form.email} onChange={updateField} required />
          <label htmlFor="contactNumber">Contact number</label>
          <input id="contactNumber" name="contactNumber" type="tel" value={form.contactNumber} onChange={updateField} minLength="7" required />
          <label htmlFor="role">I am joining as</label>
          <select id="role" name="role" value={form.role} onChange={updateField}>
            <option value="donor">Donor</option>
            <option value="partner">Partner organization</option>
          </select>
          {form.role === 'partner' && <>
            <label htmlFor="organizationName">Organization name</label>
            <input id="organizationName" name="organizationName" value={form.organizationName} onChange={updateField} minLength="2" required />
            <label htmlFor="organizationType">Organization type</label>
            <select id="organizationType" name="organizationType" value={form.organizationType} onChange={updateField}>
              <option>NGO/non-profit</option>
              <option>school</option>
              <option>barangay/community organization</option>
              <option>other</option>
            </select>
          </>}
          <div className="form-grid">
            <div><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="new-password" value={form.password} onChange={updateField} minLength="8" required /></div>
            <div><label htmlFor="confirmPassword">Confirm password</label><input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" value={form.confirmPassword} onChange={updateField} minLength="8" required /></div>
          </div>
          <button className="primary-button" type="submit" disabled={submitting}>
            <UserPlus size={18} />
            {submitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>
      </section>
    </main>
  )
}